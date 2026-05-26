import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class MobileLoginDto {
  @ApiProperty({
    example: 'engineer@marksorting.com',
    description: 'The email address of the service engineer',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The account password (minimum 6 characters)',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
