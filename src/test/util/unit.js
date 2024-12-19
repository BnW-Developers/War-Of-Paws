import Unit from '../../classes/models/unit.class.js';
import { ASSET_TYPE, DIRECTION, SPECIES, UNIT_TYPE } from '../../constants/assets.js';
import { MAX_CARDS_COUNT } from '../../constants/game.constants.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import calcDist from '../../utils/location/calcDist.js';
import { UNIT_MOVE_INTERVAL } from '../testConfig.js';
import { CURRENT_TEST, TEST_LOG_ENABLED_LOCATION_SYNC, UNIT_TEST } from '../testSwitch.js';
import { printMessage } from './print.js';
import chalk from 'chalk';

export const client_checkCardValidity = (client, assetId) => {
  if (client.species === SPECIES.DOG && (assetId < 2001 || assetId > 2006)) {
    throw new Error(`백엔드 오류 - 뽑은 카드가 강아지 카드가 아닙니다: ${assetId}`);
  }
  if (client.species === SPECIES.CAT && (assetId < 2007 || assetId > 2012)) {
    throw new Error(`백엔드 오류 - 뽑은 카드가 고양이 카드가 아닙니다: ${assetId}`);
  }
};

export const client_addCard = (client, assetId) => {
  if (client.numCards >= MAX_CARDS_COUNT) {
    throw new Error(`백엔드 오류 - 더이상 카드를 추가할 수 없습니다.`);
  }

  const currentCount = client.cards.get(assetId) || 0;
  client.cards.set(assetId, currentCount + 1);
  client.numCards++;
};

export const client_removeCard = (client, assetId, count = 1) => {
  const currentCount = client.cards.get(assetId) || 0;

  if (currentCount < count) {
    throw new Error(`사용하려는 카드를 가지고 있지 않습니다: ${assetId}`);
  }

  if (currentCount === count) {
    client.cards.delete(assetId);
  } else {
    client.cards.set(assetId, currentCount - count);
  }

  client.numCards -= count;
};

export const client_checkMergeCondition = (client, assetId) => {
  const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);

  // 엘리트카드는 합치기 불가
  if (unitData.type === UNIT_TYPE.ELITE) {
    throw new Error(`백엔드 오류 - 엘리트 카드를 합칠 수 없습니다: ${assetId}`);
  }

  if (client.cards.get(assetId) < 3) {
    throw new Error(
      `백엔드 오류 - 엘리트 카드 융합에 필요한 카드 수가 부족합니다.\n 카드: ${assetId}, 보유 장수: ${client.cards.get(assetId)}`,
    );
  }
};

export const client_addEliteCard = (client, consumedAssetId, eliteAssetId) => {
  const unitData = getGameAssetById(ASSET_TYPE.UNIT, consumedAssetId);

  if (unitData.eliteId !== eliteAssetId) {
    throw new Error(
      `백엔드 오류 - eliteAssetId ${eliteAssetId}가 consumedAssetId ${consumedAssetId}에 해당하는 엘리트가 아닙니다.`,
    );
  }

  client_removeCard(client, consumedAssetId, 3); // 합성에 사용된 3장의 카드 제거

  client_addCard(client, eliteAssetId);

  return eliteAssetId;
};

export const client_getRandomCard = (client) => {
  const cards = [];
  client.cards.forEach((count, assetId) => {
    for (let i = 0; i < count; i++) {
      cards.push(assetId);
    }
  });

  const index = Math.floor(Math.random() * cards.length);
  return cards[index];
};

export const client_addMyUnit = (client, assetId, unitId, toTop) => {
  const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
  const direction = toTop ? DIRECTION.UP : DIRECTION.DOWN;
  const unit = new Unit(unitId, unitData, direction, null);
  unit.arrived = false;

  switch (CURRENT_TEST) {
    case UNIT_TEST.OUT_OF_BOUNDS_N: // 바깥쪽: z > 3.9    안쪽: z > -1.3
      break;
    case UNIT_TEST.OUT_OF_BOUNDS_S: // 바깥쪽: z < -3.9    안쪽: z < 1.3
      break;
    case UNIT_TEST.OUT_OF_BOUNDS_W: // 바깥쪽: x < -8.6   안쪽: x < 6.0
      unit.destinationPoint.x = -10000;
      break;
    case UNIT_TEST.OUT_OF_BOUNDS_E: // 바깥쪽: x > 8.6    안쪽: x > -6.1
      unit.destinationPoint.x = 10000;
      break;
    case UNIT_TEST.WRONG_SIDE:
      unit.destinationPoint.z = direction === DIRECTION.UP ? -10000 : 10000;
      break;
    case UNIT_TEST.TOO_FAST:
      unit.speed *= 1.1;
      break;
    default:
      break;
  }

  client.myUnits.push(unit);
  client.myUnitMap.set(unitId, unit);
  client.movingUnits++;
  return unit;
};

export const client_addOpponentUnit = (client, assetId, unitId, toTop) => {
  const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
  const direction = toTop ? DIRECTION.UP : DIRECTION.DOWN;
  const unit = new Unit(unitId, unitData, direction, null);
  unit.arrived = false;

  switch (CURRENT_TEST) {
    case UNIT_TEST.OUT_OF_BOUNDS_N: // 바깥쪽: z > 3.9    안쪽: z > -1.3
      break;
    case UNIT_TEST.OUT_OF_BOUNDS_S: // 바깥쪽: z < -3.9    안쪽: z < 1.3
      break;
    case UNIT_TEST.OUT_OF_BOUNDS_W: // 바깥쪽: x < -8.6   안쪽: x < 6.0
      unit.destinationPoint.x = -10000;
      break;
    case UNIT_TEST.OUT_OF_BOUNDS_E: // 바깥쪽: x > 8.6    안쪽: x > -6.1
      unit.destinationPoint.x = 10000;
      break;
    case UNIT_TEST.WRONG_SIDE:
      unit.destinationPoint.z = direction === DIRECTION.UP ? -10000 : 10000;
      break;
    case UNIT_TEST.TOO_FAST:
      unit.speed *= 1.1;
      break;
    default:
      break;
  }

  client.opponentUnits.push(unit);
  client.opponentUnitMap.set(unitId, unit);
  return unit;
};

const client_moveUnit = (client, unit, time) => {
  if (unit.arrived) return;

  if (-7.8 + 0.3 < unit.position.x && unit.position.x < 5.2 - 0.3) {
    if (CURRENT_TEST === UNIT_TEST.OUT_OF_BOUNDS_N)
      unit.destinationPoint = { x: unit.position.x, z: 10000 };
    if (CURRENT_TEST === UNIT_TEST.OUT_OF_BOUNDS_S)
      unit.destinationPoint = { x: unit.position.x, z: -10000 };
  }

  const startPos = unit.getPosition();
  const endPos = unit.getDestination().point;

  const scalarDist = (unit.getSpeed() * time) / 1000; // 주어진 시간동안 유닛이 이동할 수 있는 직선거리
  const totalScalarDist = calcDist(startPos, endPos); // 유닛의 현재 위치에서 목적지까지의 거리
  const progressRate = scalarDist / totalScalarDist; // 유닛이 목적지까지 나아간 거리의 비율

  const x = startPos.x + (endPos.x - startPos.x) * progressRate;
  const z = startPos.z + (endPos.z - startPos.z) * progressRate;

  unit.position = { x, z };
  unit.rotation = { y: Math.floor(Math.random() * 360) };

  // 목적지 도착
  if (unit.arrivedAtDestination()) {
    unit.updateDestination();

    if (TEST_LOG_ENABLED_LOCATION_SYNC) {
      printMessage(
        chalk.magentaBright(
          `유닛 ${unit.getUnitId()}이 ${unit.destinationIndex - 1}번째 코너를 도는데 성공`,
        ),
      );
    }
  }

  // 최종 목적지 (적 성채) 도착
  if (unit.destinationIndex === 3) {
    const dir = unit.getDirection();
    const z = unit.getPosition().z;
    const cond1 = dir === DIRECTION.UP && z <= 0;
    const cond2 = dir === DIRECTION.DOWN && z >= 0;
    if (cond1 || cond2) {
      unit.arrived = true;
      client.movingUnits--;

      if (TEST_LOG_ENABLED_LOCATION_SYNC) {
        printMessage(chalk.magentaBright(`유닛 ${unit.getUnitId()}가 적 성채에 도착!`));
      }
    }
  }
};

const client_moveUnits = (client, time) => {
  client.myUnits.forEach((unit) => {
    client_moveUnit(client, unit, time);
  });
};

export const client_startMovingUnits = (client) => {
  // 기존 타이머가 있다면 제거
  client_stopMovingUnits(client);

  client.moveTimer = setInterval(() => {
    client_moveUnits(client, UNIT_MOVE_INTERVAL);
  }, UNIT_MOVE_INTERVAL); // n초마다 실행
};

export const client_stopMovingUnits = (client) => {
  if (client.moveTimer) {
    clearInterval(client.moveTimer);
    client.moveTimer = null;
  }
};

export const client_setUnitPosition = (unit, pos, rot) => {
  unit.position = pos;
  unit.rotation = rot;
};
