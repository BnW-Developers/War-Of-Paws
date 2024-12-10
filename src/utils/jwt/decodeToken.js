import jwt from 'jsonwebtoken';
import { config } from '../../config/config.js';
import CustomErr from '../error/customErr.js';
import { ERR_CODES } from '../error/errCodes.js';

export const decodeToken = (token) => {
  if (!token) throw new CustomErr(ERR_CODES.INVALID_PACKET, '토큰이 없습니다.');
  try {
    return jwt.verify(token, config.auth.secret_key);
  } catch (err) {
    throw new CustomErr(ERR_CODES.INVALID_PACKET, `잘못된 토큰입니다. ${err.name}`);
  }
};
