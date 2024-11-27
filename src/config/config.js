import {
  DB1_HOST,
  DB1_NAME,
  DB1_PASSWORD,
  DB1_PORT,
  DB1_USER,
  DB2_HOST,
  DB2_NAME,
  DB2_PASSWORD,
  DB2_PORT,
  DB2_USER,
  HOST,
  PEPPER,
  PORT,
  REDIS_DATABASE,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  SALT,
  SECRET_KEY,
} from '../constants/env.js';
import {
  PACKET_PAYLOAD_LENGTH,
  PACKET_SEQUENCE,
  PACKET_TYPE_LENGTH,
  PACKET_VERSION_LENGTH,
} from '../constants/header.js';

export const config = {
  server: {
    host: HOST,
    port: PORT,
  },
  client: {
    version: '1.0.0',
  },
  packet: {
    typeLength: PACKET_TYPE_LENGTH,
    versionLength: PACKET_VERSION_LENGTH,
    sequence: PACKET_SEQUENCE,
    payloadLength: PACKET_PAYLOAD_LENGTH,
  },
  database: {
    USER_DB: {
      name: DB1_NAME,
      user: DB1_USER,
      password: DB1_PASSWORD,
      host: DB1_HOST,
      port: DB1_PORT,
    },
    GAME_DB: {
      name: DB2_NAME,
      user: DB2_USER,
      password: DB2_PASSWORD,
      host: DB2_HOST,
      port: DB2_PORT,
    },
  },
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    database: REDIS_DATABASE,
  },
  auth: {
    pepper: PEPPER,
    salt: SALT,
    secret_key: SECRET_KEY,
  },
};
