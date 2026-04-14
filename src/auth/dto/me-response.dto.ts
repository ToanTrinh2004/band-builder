import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty({ example: 'clx1abc...' })
  userId!: string;

  @ApiProperty({ example: 'user@gmail.com' })
  email!: string;
}