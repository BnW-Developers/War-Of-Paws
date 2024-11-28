import { formatDate } from '../../utils/formatter/dateFormatter.js';
import pools from '../createPool.js';
import { SQL_GAME_QUERIES } from './game.queries.js';

export const recordGame = async (catUserId, dogUserId, winTeam) => {
  const create_at = formatDate(new Date());
  return await pools.GAME_DB.query(SQL_GAME_QUERIES.RECORD_GAME, [
    catUserId,
    dogUserId,
    winTeam,
    create_at,
  ]);
};
