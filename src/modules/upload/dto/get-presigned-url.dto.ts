import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPresignedUrlDto {
  @ApiProperty({ example: 'profile-picture.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^image\/(jpeg|png|webp|gif|svg\+xml)$/, {
    message: 'Only image files are allowed (jpeg, png, webp, gif, svg)',
  })
  fileType: string;
}
