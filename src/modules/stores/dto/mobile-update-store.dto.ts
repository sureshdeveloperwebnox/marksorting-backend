import { PartialType } from '@nestjs/swagger';
import { MobileCreateStoreDto } from './mobile-create-store.dto';

export class MobileUpdateStoreDto extends PartialType(MobileCreateStoreDto) {}
