"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.connectRedis = connectRedis;
const redis_1 = require("redis");
const config_1 = require("../config");
exports.redisClient = (0, redis_1.createClient)({
    url: config_1.config.REDIS_URL,
});
exports.redisClient.on('error', (err) => console.error('Redis Client Error', err));
async function connectRedis() {
    if (!exports.redisClient.isOpen) {
        await exports.redisClient.connect();
        console.log('🔌 Connected to Redis');
    }
}
