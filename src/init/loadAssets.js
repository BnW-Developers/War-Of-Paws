import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/log/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.join(__dirname, '../../assets');

/**
 * 파일을 비동기 병렬로 읽는 함수
 *
 * loadAssets 에서 게임에셋을 불러올 때 쓰기 위한 헬퍼 함수로 사용
 * @param {string} filename 파일명
 * @returns {Promise}
 */
const readFileAsync = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(basePath, filename), 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(JSON.parse(data));
    });
  });
};

/**
 * 로드한 게임에셋
 * @type {{animations: {}, buildings: {}, maps: {}, paths: {}, units: {}}}
 */
// TODO: 불변성을 추가할 방법 고려
export let gameAssets = {};

/**
 * 전체 게임에셋을 불러오는 함수
 *
 * 게임 시작시 실행
 * @returns {{animations: {}, buildings: {}, maps: {}, paths: {}, spells: {}, units: {}}} JSON화된 모든 게임에셋
 */
export const loadGameAssets = async () => {
  const [animations, buildings, maps, paths, spells, units] = await Promise.all([
    readFileAsync('animation.json'),
    readFileAsync('building.json'),
    readFileAsync('map.json'),
    readFileAsync('path.json'),
    readFileAsync('spell.json'),
    readFileAsync('unit.json'),
  ]);

  gameAssets = { animations, buildings, maps, paths, spells, units };
  logger.info(`GameAsset Initialized : ${Object.keys(gameAssets).length}`);
  return gameAssets;
};
