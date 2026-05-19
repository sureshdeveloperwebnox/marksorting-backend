import { PartialType } from '@nestjs/swagger';
import { CreateMillDto } from './create-mill.dto';

export class UpdateMillDto extends PartialType(CreateMillDto) {}
