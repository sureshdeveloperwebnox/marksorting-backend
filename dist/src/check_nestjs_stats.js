"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const master_mills_controller_1 = require("./modules/master-mills/master-mills.controller");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const controller = app.get(master_mills_controller_1.MasterMillsController);
    console.log('Bootstrap complete. Calling controller.getStats()...');
    const stats = await controller.getStats();
    console.log('Controller returned stats:', stats);
    console.log('Type of stats.underWarranty:', typeof stats.underWarranty);
    console.log('JSON stringified:', JSON.stringify(stats));
    await app.close();
}
bootstrap().catch(console.error);
//# sourceMappingURL=check_nestjs_stats.js.map