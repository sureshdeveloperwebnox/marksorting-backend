"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MillsModule = void 0;
const common_1 = require("@nestjs/common");
const mills_service_1 = require("./mills.service");
const mills_controller_1 = require("./mills.controller");
const mobile_mills_controller_1 = require("./mobile-mills.controller");
let MillsModule = class MillsModule {
};
exports.MillsModule = MillsModule;
exports.MillsModule = MillsModule = __decorate([
    (0, common_1.Module)({
        controllers: [mills_controller_1.MillsController, mobile_mills_controller_1.MobileMillsController],
        providers: [mills_service_1.MillsService],
        exports: [mills_service_1.MillsService],
    })
], MillsModule);
//# sourceMappingURL=mills.module.js.map