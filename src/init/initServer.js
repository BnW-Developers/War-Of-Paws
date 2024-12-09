import { testAllConnections } from '../mysql/testDataBase.js';
import { formatDate } from '../utils/formatter/dateFormatter.js';
import { loadHandlers } from './loadHandlers.js';
import { loadProtos } from './loadProto.js';
import pools from './../mysql/createPool.js';
import { loadGameAssets } from './loadAssets.js';
import { loadBanList } from './loadBanList.js';
import { notificationStatus } from '../utils/server/notiStatus.js';

export const initServer = async () => {
  let notification;
  try {
    await testAllConnections(pools);
    notification = setInterval(notificationStatus, 5000);
    await loadBanList();
    await loadGameAssets();
    await loadProtos();
    await loadHandlers();
  } catch (err) {
    const date = new Date();
    clearInterval(notification);
    console.error(`[${formatDate(date)} - FAIL] Failed to initialize server`, err);
    process.exit(1);
  }
};
