"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let Account = class Account {
    AccountId;
    UserId;
    AccountName;
    AccountType;
    Balance;
    Currency;
    user;
};
exports.Account = Account;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Account.prototype, "AccountId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Account.prototype, "UserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Account.prototype, "AccountName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], Account.prototype, "AccountType", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Account.prototype, "Balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, default: 'VND' }),
    __metadata("design:type", String)
], Account.prototype, "Currency", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'UserId' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], Account.prototype, "user", void 0);
exports.Account = Account = __decorate([
    (0, typeorm_1.Entity)('Account')
], Account);
//# sourceMappingURL=account.entity.js.map