import { config } from '../../config/config.js';
import jwt from 'jsonwebtoken';

export const createJWT = (userId) => {
  const payload = { userId };
  const options = { expiresIn: '1h' };
  const token = jwt.sign(payload, config.auth.secret_key, options);
  return token;
};
