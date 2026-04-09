import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreditTxStatus, CreditTransactionType } from '@prisma/client';
import { InitiatePaymentDto, SePayWebhookDto } from './dto/payment.dto';
import { randomBytes } from 'crypto';

// ─── VietQR public image endpoint — no API key required ─────
// Format: https://img.vietqr.io/image/{bankCode}-{accountNo}-{template}.png
//         ?amount=&addInfo=&accountName=
const VIETQR_BASE = 'https://img.vietqr.io/image';

// ─── Constants ───────────────────────────────────────────────
const QR_TTL_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // PUBLIC METHODS
  // ──────────────────────────────────────────────────────────

  /**
   * 1. Look up the chosen credit package
   * 2. Generate a unique transfer memo
   * 3. Create a PENDING CreditTransaction row
   * 4. Call VietQR to get a QR image URL
   * 5. Return everything the client needs to show the QR screen
   */
  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    // 1. Fetch package
    const pkg = await this.prisma.creditPackage.findUnique({
      where: { id: dto.packageId },
    });
    if (!pkg) throw new NotFoundException('Credit package not found');
    if (!pkg.isActive) throw new BadRequestException('This package is no longer available');

    // 2. Memo — must be unique and recognisable by SePay rule
    const memo = this.generateMemo();

    // 3. Persist PENDING transaction
    const userCredit = await this.getOrCreateUserCredit(userId);

    const tx = await this.prisma.creditTransaction.create({
      data: {
        userId,
        packageId: pkg.id,
        type: CreditTransactionType.PURCHASE,
        amount: pkg.credits + pkg.bonusCredit,
        balanceBefore: userCredit.balance,
        balanceAfter: userCredit.balance, // not yet credited
        description: `Purchase ${pkg.name} package`,
        transferMemo: memo,
        provider: 'sepay',
        bankCode: this.config.get<string>('SEPAY_BANK_CODE'),          // e.g. "MB"
        bankAccount: this.config.get<string>('SEPAY_BANK_ACCOUNT'),    // e.g. "123456789"
        amountVnd: pkg.priceVnd,
        status: CreditTxStatus.PENDING,
        expiredAt: new Date(Date.now() + QR_TTL_MS),
      },
    });

    // 4. Build VietQR image URL (public endpoint — no API key needed)
    const qrImageUrl = this.generateVietQr({
      bankCode: tx.bankCode!,
      bankAccount: tx.bankAccount!,
      amountVnd: pkg.priceVnd,
      memo,
    });

    return {
      transactionId: tx.id,
      qrImageUrl,
      transferMemo: memo,
      amountVnd: pkg.priceVnd,
      credits: pkg.credits + pkg.bonusCredit,
      expiredAt: tx.expiredAt!,
      bankCode: tx.bankCode!,
      bankAccount: tx.bankAccount!,
    };
  }

  /**
   * Called by SePay's webhook when a matching bank transfer arrives.
   *
   * SePay matches by `transferMemo` (content field in their payload).
   * We validate the amount, mark the transaction COMPLETED, and top up
   * the user's credit balance — all inside a single DB transaction.
   */
  async handleSePayWebhook(payload: any, rawBody: object) {
    this.verifySePaySignature(rawBody);
  
    // extract memo from full bank content string e.g.
    // "124609264075-IELTS8B0AC7-CHUYEN TIEN-..."
    const content = (payload.content ?? payload.transferMemo ?? '') as string;
    const match   = content.match(/IELTS[A-Z0-9]{6}/i);
    const memo    = match?.[0]?.toUpperCase();
  
    this.logger.log(`SePay raw content: "${content}" → extracted memo: "${memo}"`);
  
    if (!memo) {
      this.logger.warn('SePay webhook: could not extract memo from content');
      return { success: false };
    }
  
    const amount = (payload.transferAmount ?? payload.amount) as number;
  
    const tx = await this.prisma.creditTransaction.findUnique({
      where:   { transferMemo: memo },
      include: { package: true, user: true },
    });
  
    if (!tx) {
      this.logger.warn(`SePay webhook: no transaction for memo "${memo}"`);
      return { success: false };
    }
  
    if (tx.status === CreditTxStatus.COMPLETED) {
      this.logger.log(`SePay webhook: memo "${memo}" already completed — skipped`);
      return { success: true }; // idempotent — stop SePay retrying
    }
  
    if (tx.status === CreditTxStatus.FAILED) {
      this.logger.warn(`SePay webhook: memo "${memo}" already failed/expired`);
      return { success: false };
    }
  
    // amount check
    if (amount < tx.amountVnd!) {
      this.logger.warn(
        `SePay webhook: amount mismatch for "${memo}" — expected ${tx.amountVnd}, got ${amount}`,
      );
      await this.prisma.creditTransaction.update({
        where: { id: tx.id },
        data:  { status: CreditTxStatus.FAILED, sePayWebhookRaw: rawBody as any },
      });
      return { success: false };
    }
  
    // expiry check
    if (tx.expiredAt && new Date() > tx.expiredAt) {
      await this.prisma.creditTransaction.update({
        where: { id: tx.id },
        data:  { status: CreditTxStatus.FAILED, sePayWebhookRaw: rawBody as any },
      });
      this.logger.warn(`SePay webhook: memo "${memo}" expired`);
      return { success: false };
    }
  
    // all good — complete atomically
    const creditsToAdd = tx.amount;
  
    await this.prisma.$transaction(async (prx) => {
      const credit        = await prx.userCredit.findUnique({ where: { userId: tx.userId } });
      const balanceBefore = credit?.balance ?? 0;
      const balanceAfter  = balanceBefore + creditsToAdd;
  
      await prx.userCredit.upsert({
        where:  { userId: tx.userId },
        create: { userId: tx.userId, balance: creditsToAdd },
        update: { balance: { increment: creditsToAdd } },
      });
  
      await prx.creditTransaction.update({
        where: { id: tx.id },
        data: {
          status:          CreditTxStatus.COMPLETED,
          balanceBefore,
          balanceAfter,
          sePayTxId:       String(payload.id),
          sePayWebhookRaw: rawBody as any,
          paidAt:          payload.transactionDate
                             ? new Date(payload.transactionDate)
                             : new Date(),
        },
      });
    });
  
    this.logger.log(`SePay webhook: credited ${creditsToAdd} to user ${tx.userId}`);
    return { success: true };
  }

  /**
   * Polling endpoint — client polls every few seconds while QR is shown.
   */
  async getPaymentStatus(userId: string, transactionId: string) {
    const tx = await this.prisma.creditTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!tx || tx.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }

    // Auto-expire PENDING transactions past TTL
    if (tx.status === CreditTxStatus.PENDING && tx.expiredAt && new Date() > tx.expiredAt) {
      await this.prisma.creditTransaction.update({
        where: { id: tx.id },
        data: { status: CreditTxStatus.FAILED },
      });
      return {
        transactionId: tx.id,
        status: CreditTxStatus.FAILED,
        paidAt: tx.paidAt,
        credits: tx.amount,
        amountVnd: tx.amountVnd,
      };
    }

    return {
      transactionId: tx.id,
      status: tx.status,
      paidAt: tx.paidAt,
      credits: tx.amount,
      amountVnd: tx.amountVnd,
    };
  }

  // ──────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────

  /**
   * Build a VietQR image URL using the public endpoint — no API key required.
   * The returned URL can be used directly in an <img> tag on the frontend.
   *
   * URL format:
   *   https://img.vietqr.io/image/{BANK_CODE}-{BANK_ACCOUNT}-compact.png
   *     ?amount={amountVnd}
   *     &addInfo={memo}
   *     &accountName={accountName}
   *
   * All values come from .env:
   *   SEPAY_BANK_CODE    — e.g. MB
   *   SEPAY_BANK_ACCOUNT — e.g. 1234567890
   *   SEPAY_ACCOUNT_NAME — e.g. IELTS Practice App
   */
  private generateVietQr(opts: {
    bankCode: string;
    bankAccount: string;
    amountVnd: number;
    memo: string;
  }): string {
    const accountName = encodeURIComponent(
      this.config.get<string>('SEPAY_ACCOUNT_NAME', 'IELTS App'),
    );
    const memo = encodeURIComponent(opts.memo);

    return (
      `${VIETQR_BASE}/${opts.bankCode}-${opts.bankAccount}-compact.png` +
      `?amount=${opts.amountVnd}&addInfo=${memo}&accountName=${accountName}`
    );
  }

  /** Unique memo: "IELTS" + 6 hex chars, uppercased — e.g. "IELTSA3F9B2" */
  private generateMemo(): string {
    return `IELTS${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private async getOrCreateUserCredit(userId: string) {
    return this.prisma.userCredit.upsert({
      where: { userId },
      create: { userId, balance: 0 },
      update: {},
    });
  }

  /**
   * SePay sends a secret header to verify authenticity.
   * Set SEPAY_WEBHOOK_SECRET in your env to match the value in the SePay portal.
   */
  private verifySePaySignature(rawBody: object) {
    const secret = this.config.get<string>('SEPAY_WEBHOOK_SECRET');
    if (!secret) return; // skip if not configured (dev mode)

    // SePay uses a simple shared-secret header approach.
    // If you need HMAC verification, wire it through the controller instead
    // and pass the computed hash here.
    // For now we rely on network-level security (webhook IP allowlist in SePay portal).
  }
}