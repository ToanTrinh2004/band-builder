import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import {
  InitiatePaymentDto,
  SePayWebhookDto,
  PaymentQrResponseDto,
  PaymentStatusResponseDto,
  CreditPackageResponseDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard'; // adjust path
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // adjust path

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  // ──────────────────────────────────────────────────────────
  // POST /payment/initiate
  // Authenticated — user selects a package, gets back QR data
  // ──────────────────────────────────────────────────────────
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async initiatePayment(
    @Req() req: Request,
    @Body() dto: InitiatePaymentDto,
  ): Promise<PaymentQrResponseDto> {
    const userId = (req.user as any).userId;
    return this.paymentService.initiatePayment(userId, dto);
  }

  @Get('packages')
  @ApiOperation({ summary: 'Get all available credit packages' })
  @ApiResponse({ status: 200, type: [CreditPackageResponseDto] })
  async getCreditPackages(): Promise<CreditPackageResponseDto[]> {
    return this.paymentService.getAllCreditPackages();
  }
  // ──────────────────────────────────────────────────────────
  // GET /payment/status/:transactionId
  // Client polls while user is on the QR screen
  // ──────────────────────────────────────────────────────────
  @Get('status/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Poll status of a pending credit purchase' })
  @ApiResponse({ status: 200, type: PaymentStatusResponseDto })
  async getStatus(
    @CurrentUser('userId') userId: string,
    @Param('transactionId') transactionId: string,
  ): Promise<PaymentStatusResponseDto> {
    return this.paymentService.getPaymentStatus(userId, transactionId);
  }

  @Post('webhook/sepay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SePay webhook receiver — do not call manually' })
  async sePayWebhook(
    @Body() payload: SePayWebhookDto,
    @Req() req: Request,
  ): Promise<{ success: boolean }> {
    this.logger.log(`SePay webhook received: memo=${payload.transferMemo} amount=${payload.amount}`);

    
    const result = await this.paymentService.handleSePayWebhook(payload, req.body as object);
    return result;
  }
}