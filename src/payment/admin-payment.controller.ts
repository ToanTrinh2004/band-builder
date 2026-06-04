import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PaymentService } from './payment.service';
import { CreateCreditPackageDto, UpdateCreditPackageDto } from './dto/admin-payment.dto';
import { CreditPackageResponseDto } from './dto/payment.dto';

@ApiTags('Admin Payment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/packages')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AdminPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các gói nạp (cho Admin)' })
  @ApiResponse({ status: 200, type: [CreditPackageResponseDto] })
  getAllPackages() {
    return this.paymentService.adminGetPackages();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới một gói nạp credit' })
  @ApiResponse({ status: 201, type: CreditPackageResponseDto })
  createPackage(@Body() dto: CreateCreditPackageDto) {
    return this.paymentService.adminCreatePackage(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin gói nạp credit' })
  @ApiParam({ name: 'id', description: 'ID của gói nạp' })
  @ApiResponse({ status: 200, type: CreditPackageResponseDto })
  updatePackage(@Param('id') id: string, @Body() dto: UpdateCreditPackageDto) {
    return this.paymentService.adminUpdatePackage(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một gói nạp credit' })
  @ApiParam({ name: 'id', description: 'ID của gói nạp' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  deletePackage(@Param('id') id: string) {
    return this.paymentService.adminDeletePackage(id);
  }
}
