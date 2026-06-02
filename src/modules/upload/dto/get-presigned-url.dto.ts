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
  @Matches(
    /^image\/(jpeg|jpg|png|webp|gif|svg\+xml|bmp|tiff|avif|heic|heif)$/,
    {
      message:
        'Only image files are allowed (jpeg, jpg, png, webp, gif, svg, bmp, tiff, avif, heic, heif)',
    },
  )
  fileType: string;
}
