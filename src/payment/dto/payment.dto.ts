import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ─── Request DTOs ───────────────────────────────────────────

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Credit package ID to purchase' })
  @IsUUID()
  @IsNotEmpty()
  packageId: string;
}

export class SePayWebhookDto {
  id:              string;
  content:         string;   // ← full bank description string
  transferAmount:  number;   // ← also fix this
  bankCode:        string;
  bankAccount:     string;
  transactionDate: string;
  [key: string]: unknown;
}
// ─── Response DTOs ──────────────────────────────────────────

export class PaymentQrResponseDto {
  @ApiProperty({ description: 'Internal credit transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'VietQR image URL (embed directly in <img>)' })
  qrImageUrl: string;

  @ApiProperty({ description: 'Transfer memo the user must include' })
  transferMemo: string;

  @ApiProperty({ description: 'Amount in VND' })
  amountVnd: number;

  @ApiProperty({ description: 'Credits that will be granted on success' })
  credits: number;

  @ApiProperty({ description: 'QR expiry (15 min from now)' })
  expiredAt: Date;

  @ApiProperty({ description: 'Receiving bank code, e.g. MB' })
  bankCode: string;

  @ApiProperty({ description: 'Receiving bank account number' })
  bankAccount: string;
}

export class PaymentStatusResponseDto {
  @ApiProperty({ enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] })
  status: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty({ nullable: true })
  paidAt: Date | null;

  @ApiProperty()
  credits: number;

  @ApiProperty({ nullable: true })
  amountVnd: number | null;
}
export class CreditPackageResponseDto {
  @ApiProperty({
    example: 'pkg_basic',
    description: 'Unique identifier of the credit package',
  })
  id: string;

  @ApiProperty({
    example: 'Starter Pack',
    description: 'Name of the credit package',
  })
  name: string;

  @ApiProperty({
    example: 100,
    description: 'Number of credits included',
  })
  credits: number;

  @ApiProperty({
    example: 50000,
    description: 'Price in VND',
  })
  priceVnd: number;

  @ApiProperty({
    example: 10,
    description: 'Bonus credits included',
  })
  bonusCredit: number;

  @ApiProperty({
    example: true,
    description: 'Whether the package is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: 1,
    description: 'Display order',
  })
  sortOrder: number;

  @ApiProperty({
    example: '2026-04-09T10:00:00.000Z',
    description: 'Created date',
  })
  createdAt: Date;
}