import { PartialType } from '@nestjs/swagger';
import { CreateMasterMillDto } from './create-master-mill.dto';

export class UpdateMasterMillDto extends PartialType(CreateMasterMillDto) {}
