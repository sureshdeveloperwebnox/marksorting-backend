import { ApiProperty } from '@nestjs/swagger';

export class MobileLoginResponseDto {
  @ApiProperty({
    description:
      'JWT Access Token used to authenticate subsequent API requests',
  })
  access_token: string;

  @ApiProperty({
    description: 'JWT Refresh Token used to obtain new access tokens',
  })
  refresh_token: string;
}
