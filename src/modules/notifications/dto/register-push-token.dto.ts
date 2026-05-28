import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum DeviceType {
  WEB = 'WEB',
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

export class RegisterPushTokenDto {
  @ApiProperty({ description: 'FCM device push token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({
    enum: DeviceType,
    default: DeviceType.WEB,
    description: 'Device type that registered the token',
  })
  @IsEnum(DeviceType)
  device_type: DeviceType = DeviceType.WEB;
}
