import Redis from 'ioredis';
import { config } from '../config/config.js';

const redisClient = new Redis({
  host: config.database.redis.host,
  port: config.database.redis.port,
  password: config.database.redis.password,
});

redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (err) => console.log('Redis Client Error', err));

export default redisClient;
