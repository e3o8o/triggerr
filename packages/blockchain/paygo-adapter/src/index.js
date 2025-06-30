"use strict";
// ===========================================================================
// PayGo ADAPTER PACKAGE - Public API
// ===========================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPayGoClient = exports.isPayGoClientInitialized = exports.getPayGoClient = exports.initPayGoClientWithNewWallet = exports.initPayGoClient = exports.FaucetRequest = exports.ReleaseEscrow = exports.FulfillEscrow = exports.CreateEscrow = exports.Transfer = exports.PaygoClient = exports.convertFromPayGoAmount = exports.convertToPayGoAmount = exports.safePayGoCall = exports.PayGoClientService = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "PayGoClientService", { enumerable: true, get: function () { return __importDefault(client_1).default; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "safePayGoCall", { enumerable: true, get: function () { return utils_1.safePayGoCall; } });
Object.defineProperty(exports, "convertToPayGoAmount", { enumerable: true, get: function () { return utils_1.convertToPayGoAmount; } });
Object.defineProperty(exports, "convertFromPayGoAmount", { enumerable: true, get: function () { return utils_1.convertFromPayGoAmount; } });
// Re-export PayGo transaction classes to avoid TypeScript import issues
var client_2 = require("./client");
Object.defineProperty(exports, "PaygoClient", { enumerable: true, get: function () { return client_2.PaygoClient; } });
Object.defineProperty(exports, "Transfer", { enumerable: true, get: function () { return client_2.Transfer; } });
Object.defineProperty(exports, "CreateEscrow", { enumerable: true, get: function () { return client_2.CreateEscrow; } });
Object.defineProperty(exports, "FulfillEscrow", { enumerable: true, get: function () { return client_2.FulfillEscrow; } });
Object.defineProperty(exports, "ReleaseEscrow", { enumerable: true, get: function () { return client_2.ReleaseEscrow; } });
Object.defineProperty(exports, "FaucetRequest", { enumerable: true, get: function () { return client_2.FaucetRequest; } });
// Export initialization functions
var init_1 = require("./init");
Object.defineProperty(exports, "initPayGoClient", { enumerable: true, get: function () { return init_1.initPayGoClient; } });
Object.defineProperty(exports, "initPayGoClientWithNewWallet", { enumerable: true, get: function () { return init_1.initPayGoClientWithNewWallet; } });
Object.defineProperty(exports, "getPayGoClient", { enumerable: true, get: function () { return init_1.getPayGoClient; } });
Object.defineProperty(exports, "isPayGoClientInitialized", { enumerable: true, get: function () { return init_1.isPayGoClientInitialized; } });
Object.defineProperty(exports, "resetPayGoClient", { enumerable: true, get: function () { return init_1.resetPayGoClient; } });
//# sourceMappingURL=index.js.map