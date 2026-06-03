import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminUserService } from './admin-user.service';
import { AdjustCreditsDto, UpdateUserRoleDto } from './dto/admin-user.dto';

@ApiTags('Admin Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  @ApiOperation({ summary: 'List all users with credit balances (Admin only)' })
  async listUsers() {
    return this.adminUserService.listUsers();
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get credit transaction history of a user (Admin only)' })
  async getUserTransactions(@Param('id') id: string) {
    return this.adminUserService.getUserTransactions(id);
  }

  @Post(':id/adjust-credits')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust credits for a user (Admin only)' })
  async adjustCredits(
    @Param('id') id: string,
    @Body() dto: AdjustCreditsDto,
  ) {
    return this.adminUserService.adjustCredits(id, dto);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update role of a user (Admin only)' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminUserService.updateUserRole(id, dto);
  }
}
