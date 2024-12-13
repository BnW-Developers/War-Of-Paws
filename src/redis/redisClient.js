import Redis from 'ioredis';
import { COMMON_CONFIG as config } from '../config/config.js';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (err) => console.log('Redis Client Error', err));

export default redisClient;
