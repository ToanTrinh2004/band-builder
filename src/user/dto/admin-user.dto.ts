import { IsNumber, IsString, IsNotEmpty, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustCreditsDto {
  @ApiProperty({ example: 100, description: 'Number of credits to adjust' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'BONUS', enum: ['BONUS', 'REFUND'], description: 'Adjustment type' })
  @IsEnum(['BONUS', 'REFUND'])
  type: 'BONUS' | 'REFUND';

  @ApiProperty({ example: 'Khuyến khích học viên học tập chăm chỉ', description: 'Reason for adjustment' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'ADMIN', enum: ['STUDENT', 'ADMIN'], description: 'User role' })
  @IsEnum(['STUDENT', 'ADMIN'])
  role: 'STUDENT' | 'ADMIN';
}
