import { testAllConnections } from '../mysql/testDataBase.js';
import { formatDate } from '../utils/formatter/dateFormatter.js';
import { loadHandlers } from './loadHandlers.js';
import { loadProtos } from './loadProto.js';
import pools from './../mysql/createPool.js';
import { loadGameAssets } from './loadAssets.js';
import { loadBanList } from './loadBanList.js';

export const initServer = async () => {
  try {
    // TODO: 현재 기획중인 서버 설계에 따른 초기화 진행 필요한 함수 추가 필요
    // DB 연결 안 되어있는 관계로 임시 주석
    // await testAllConnections(pools);
    await loadBanList();
    await loadGameAssets();
    await loadProtos();
    await loadHandlers();
  } catch (err) {
    const date = new Date();
    console.error(`[${formatDate(date)} - FAIL] Failed to initialize server`, err);
    process.exit(1);
  }
};
