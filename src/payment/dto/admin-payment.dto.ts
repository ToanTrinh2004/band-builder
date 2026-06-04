import { IsString, IsInt, IsBoolean, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCreditPackageDto {
  @ApiProperty({ description: 'Name of the credit package', example: 'Gói Starter' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Number of credits included', example: 100 })
  @IsInt()
  @Min(0)
  credits: number;

  @ApiProperty({ description: 'Price in VND', example: 50000 })
  @IsInt()
  @Min(0)
  priceVnd: number;

  @ApiProperty({ description: 'Bonus credits included', required: false, example: 10 })
  @IsInt()
  @Min(0)
  @IsOptional()
  bonusCredit?: number;

  @ApiProperty({ description: 'Whether the package is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Display order', required: false, default: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateCreditPackageDto {
  @ApiProperty({ description: 'Name of the credit package', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Number of credits included', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  credits?: number;

  @ApiProperty({ description: 'Price in VND', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  priceVnd?: number;

  @ApiProperty({ description: 'Bonus credits included', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  bonusCredit?: number;

  @ApiProperty({ description: 'Whether the package is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Display order', required: false })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
