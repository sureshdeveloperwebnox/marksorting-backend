import 'reflect-metadata';
import { CreateMasterMillDto } from './src/modules/master-mills/dto/create-master-mill.dto';

// Get metadata keys for the class
console.log('Class metadata keys:', Reflect.getMetadataKeys(CreateMasterMillDto));

const dto = new CreateMasterMillDto();
// Let's inspect class-transformer internal storage if possible, or print properties
console.log('DTO Properties:', Object.getOwnPropertyNames(dto));
