"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const create_master_mill_dto_1 = require("./src/modules/master-mills/dto/create-master-mill.dto");
console.log('Class metadata keys:', Reflect.getMetadataKeys(create_master_mill_dto_1.CreateMasterMillDto));
const dto = new create_master_mill_dto_1.CreateMasterMillDto();
console.log('DTO Properties:', Object.getOwnPropertyNames(dto));
//# sourceMappingURL=check_metadata.js.map