import { formatDate } from '../../utils/formatter/dateFormatter.js';
import pools from '../createPool.js';

export const SQL_GAME_QUERIES = {
  RECORD_GAME: 'INSERT INTO game_log (win_user_id, lose_user_id) VALUES (?, ?)',
};

export const recordGame = async (winUserId, loseUserId) => {
  const create_at = formatDate(new Date());
  return await pools.GAME_DB.query(SQL_GAME_QUERIES.RECORD_GAME, [
    winUserId,
    loseUserId,
    create_at,
  ]);
};
