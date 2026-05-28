"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogActivity = exports.LOG_ACTIVITY_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.LOG_ACTIVITY_KEY = 'log_activity';
const LogActivity = (options) => (0, common_1.SetMetadata)(exports.LOG_ACTIVITY_KEY, options);
exports.LogActivity = LogActivity;
//# sourceMappingURL=log-activity.decorator.js.map