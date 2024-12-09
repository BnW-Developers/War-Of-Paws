import dotenv from 'dotenv';

dotenv.config();

/* ============================SERVER============================ */
export const PORT = process.env.PORT || 3000;
export const HOST = process.env.HOST || 'localhost';
export const API_SERVER_PORT = process.env.API_SERVER_PORT;

/* ============================ D B ============================ */
export const DB1_NAME = process.env.DB1_NAME || 'db1';
export const DB1_USER = process.env.DB1_USER || 'root';
export const DB1_PASSWORD = process.env.DB1_PASSWORD || '1q2w3e4r';
export const DB1_HOST = process.env.DB1_HOST || 'localhost';
export const DB1_PORT = process.env.DB1_PORT || 3306;

export const DB2_NAME = process.env.DB2_NAME || 'db2';
export const DB2_USER = process.env.DB2_USER || 'root';
export const DB2_PASSWORD = process.env.DB2_PASSWORD || '1q2w3e4r';
export const DB2_HOST = process.env.DB2_HOST || 'localhost';
export const DB2_PORT = process.env.DB2_PORT || 3306;

/* ============================REDIS============================= */
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = process.env.REDIS_PORT || 6379;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '1q2w3e4r';
export const REDIS_DATABASE = process.env.REDIS_DATABASE || 0;

/* ============================ AUTH ============================ */
export const PEPPER = process.env.PEPPER;
export const SALT = process.env.SALT;
export const SECRET_KEY = process.env.SECRET_KEY;
export const API_KEY = process.env.API_KEY;

/* ============================ HOST ============================ */
export const HEALTH_SERVER_HOST = process.env.HEALTH_SERVER_HOST;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
