import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'currentPassword123',
    description: 'The current password of the service engineer',
  })
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @ApiProperty({
    example: 'newSecurePassword123!',
    description:
      'The new password (minimum 8 characters, maximum 128 characters). Must contain at least one letter and one number.',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/,
    {
      message: 'Password must contain at least one letter and one number',
    },
  )
  new_password: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({
    example: 'Password changed successfully',
    description: 'Success message',
  })
  message: string;
}
