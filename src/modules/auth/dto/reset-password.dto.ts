import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a5d93b3c-df8b-491c-99a3-5eb76db7a2f1',
    description: 'The secure reset token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'The new secure password (minimum 8 characters)',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
