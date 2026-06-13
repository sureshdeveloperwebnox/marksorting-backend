"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterMillsModule = void 0;
const common_1 = require("@nestjs/common");
const master_mills_service_1 = require("./master-mills.service");
const master_mills_controller_1 = require("./master-mills.controller");
let MasterMillsModule = class MasterMillsModule {
};
exports.MasterMillsModule = MasterMillsModule;
exports.MasterMillsModule = MasterMillsModule = __decorate([
    (0, common_1.Module)({
        controllers: [master_mills_controller_1.MasterMillsController],
        providers: [master_mills_service_1.MasterMillsService],
        exports: [master_mills_service_1.MasterMillsService],
    })
], MasterMillsModule);
//# sourceMappingURL=master-mills.module.js.map