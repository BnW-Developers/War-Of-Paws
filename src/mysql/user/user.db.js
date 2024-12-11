import { formatDate } from '../../utils/formatter/dateFormatter.js';
import logger from '../../utils/log/logger.js';
import pools from '../createPool.js';
import { toCamelCase } from '../utils.js';
import { SQL_QUERIES } from './user.queries.js';

/**
 * userId로 db에서 유저 검색
 *
 * @param {string} userId 계정 아이디
 * @returns 계정 객체 반환
 */

export const findUserById = async (userId) => {
  const [rows] = await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_ID, [userId]);
  return toCamelCase(rows[0]);
};

/**
 * db에 유저 생성
 *
 * @param {string} id 계정 아이디
 * @param {string} password 계정 비밀번호
 * @param {string} email 계정 이메일
 * @returns 계정 객체 반환
 */

export const createUser = async (id, password, email) => {
  const created_at = formatDate(new Date());
  return await pools.USER_DB.query(SQL_QUERIES.CREATE_USER, [id, password, email, created_at]);
};

export const findOrCreateUserByGoogleId = async (googleId, email, name) => {
  try {
    // First, try to find an existing user with this Google ID
    let user = await findUserByGoogleId(googleId);

    // If no user exists, create a new one
    if (!user) {
      user = await createGoogleUser(googleId, email, name);
    }

    return user;
  } catch (error) {
    logger.error('Error in findOrCreateUserByGoogleId:', error);
    throw error;
  }
};

export const findUserByGoogleId = async (googleId) => {
  const [rows] = await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_GOOGLE_ID, [googleId]);
  return toCamelCase(rows[0]);
};

export const createGoogleUser = async (googleId, email, name) => {
  const created_at = formatDate(new Date());
  return await pools.USER_DB.query(SQL_QUERIES.CREATE_GOOGLE_USER, [
    googleId,
    email,
    name,
    created_at,
  ]);
};
