import { blockList } from '../server.js';
import { readBanList } from '../utils/util/blockIp.js';

export const loadBanList = async () => {
  const banList = await readBanList();
  banList.banned_ips.forEach((ban) => {
    blockList.addAddress(ban.ip);
  });
};
