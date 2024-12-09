import { config } from '../../config/config.js';
import bcrypt from 'bcrypt';

export const hashed = async (key) => {
  const salt = Number(config.auth.salt);
  return await bcrypt.hash(key, salt);
};
