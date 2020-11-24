"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.JobStream = exports.GenericStream = void 0;
var uuid_1 = require("uuid");
var GenericStream = /** @class */ (function () {
    function GenericStream(redis, topic) {
        this.redis = redis;
        this.topic = topic;
    }
    GenericStream.prototype.queue = function () {
        var _this = this;
        var obj = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            obj[_i] = arguments[_i];
        }
        return new Promise(function (acc, rej) {
            var _a;
            (_a = _this.redis).RPUSH.apply(_a, __spreadArrays([_this.topic], obj, [function (err, value) {
                    if (err)
                        rej(err);
                    else
                        acc(value);
                }]));
        });
    };
    GenericStream.prototype.next = function () {
        var _this = this;
        return new Promise(function (acc, rej) {
            _this.redis.BLPOP(_this.topic, 0, function (err, value) {
                if (err)
                    rej(err);
                else
                    acc(value);
            });
        });
    };
    return GenericStream;
}());
exports.GenericStream = GenericStream;
var JobStream = /** @class */ (function (_super) {
    __extends(JobStream, _super);
    function JobStream() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    JobStream.prototype.handleJob = function (jobHandler) {
        var _this = this;
        this.redis.BLPOP(this.topic + "_jobs", 0, function (err, raw_value) { return __awaiter(_this, void 0, void 0, function () {
            var job_id, value, v;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (err)
                            throw err;
                        job_id = raw_value.split(';')[0];
                        value = raw_value.replace(job_id + ';', '');
                        v = jobHandler(value);
                        if (!(v instanceof Promise)) return [3 /*break*/, 2];
                        return [4 /*yield*/, v];
                    case 1:
                        v = _a.sent();
                        _a.label = 2;
                    case 2:
                        // Publish our completed job results
                        this.redis.PUBLISH(this.topic + "_job_" + job_id, v);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    JobStream.prototype.queueJob = function (payload) {
        var _this = this;
        var job_id = uuid_1.v4().replace('-', '');
        return {
            job_id: job_id,
            job: new Promise(function (acc, rej) {
                _this.redis.RPUSH(_this.topic + "_jobs", job_id + ";" + payload, function (err, value) {
                    var job_channel = _this.topic + "_job_" + job_id;
                    _this.redis.SUBSCRIBE(job_channel);
                    _this.redis.on("message", function (channel, message) {
                        if (channel == job_channel) {
                            this.redis.UNSUBSCRIBE(job_channel);
                            acc(message);
                        }
                    });
                });
            })
        };
    };
    return JobStream;
}(GenericStream));
exports.JobStream = JobStream;
