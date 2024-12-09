import bcrypt from 'bcrypt';
import { config } from '../../config/config.js';

export const checkHashed = async (hash) => {
  return await bcrypt.compare(config.auth.key, hash);
};
