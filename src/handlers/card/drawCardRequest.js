import { ASSET_TYPE, UNIT_TYPE } from '../../constants/assets.js';
import { BUTTON_CONFIG, MAX_CARDS_COUNT } from '../../constants/game.constants.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getGameAsset } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 카드 뽑기 요청 핸들러
 * @param {Object} socket - 카드 뽑기 요청을 보낸 플레이어의 소켓 객체
 * @param {number} payload.buttonType - 버튼 등급 (0: 낮음, 1: 중간, 2: 높음)
 */
const drawCardRequest = (socket, payload) => {
  try {
    const { buttonType } = payload;

    const { user, userGameData } = checkSessionInfo(socket);

    const species = user.getCurrentSpecies();

    // 소지 카드 제한 확인
    if (userGameData.getCardCount() > MAX_CARDS_COUNT) {
      throw new CustomErr(ERR_CODES.MAX_CARDS_REACHED, 'Maximum cards limit reached');
    }

    // 버튼 설정 가져오기
    const button = BUTTON_CONFIG[buttonType];
    if (!button) {
      throw new CustomErr(ERR_CODES.INVALID_BUTTON_TYPE, 'Invalid button type');
    }

    // 자원 검증
    if (userGameData.getMineral() < button.cost) {
      throw new CustomErr(ERR_CODES.UNIT_INSUFFICIENT_FUNDS, 'Not enough minerals');
    }

    // 자원 차감
    const resultMineral = userGameData.spendMineral(button.cost);

    // 등급 선택 확률 배열을 넣어주고 티어 가챠
    const tier = selectTier(button.probabilities);

    // 해당 등급의 유닛 ID 가져오기
    const randomUnitAssetId = selectRandomUnitAssetIdByTier(species, tier);

    logger.info(`Selected tier: ${tier}, Selected unit ID: ${randomUnitAssetId}`);

    // 카드 추가
    userGameData.addCard(randomUnitAssetId);

    // 소모 미네랄 싱크
    sendPacket(socket, PACKET_TYPE.MINERAL_SYNC_NOTIFICATION, { mineral: resultMineral });

    // 카드 뽑기 응답 전송
    sendPacket(socket, PACKET_TYPE.DRAW_CARD_RESPONSE, {
      assetId: randomUnitAssetId,
    });

    // 엘리트 카드 발동 여부 체크 -> 엘리트 카드가 3장일 경우
    if (userGameData.isMergeableCard(randomUnitAssetId)) {
      // 엘리트 카드 생성 및 노티피케이션 전송
      const eliteUnitId = userGameData.addEliteCard(randomUnitAssetId);
      logger.info(`Elite Card created successfully! id:${eliteUnitId}}`);

      sendPacket(socket, PACKET_TYPE.ELITE_CARD_NOTIFICATION, {
        consumedAssetId: randomUnitAssetId,
        eliteAssetId: eliteUnitId,
      });
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

const selectTier = (probabilities) => {
  const random = Math.random();
  let cumulative = 0;

  // 각 등급을 순회하며 확률을 누적하고 비교
  for (let tier in probabilities) {
    cumulative += probabilities[tier]; // 랜덤 값이 0.65보다 작은지, 0.90보다 작은지, 1보다 작은지 비교
    if (random <= cumulative) {
      return parseInt(tier);
    }
  }
};

const selectRandomUnitAssetIdByTier = (species, tier) => {
  // 모든 유닛 데이터를 가져오기
  const allUnits = getGameAsset(ASSET_TYPE.UNIT).data;

  // 노말 유닛 필터링
  const normalUnits = allUnits.filter((unit) => unit.type === UNIT_TYPE.NORMAL);

  // 특정 종의 유닛 필터링
  const unitsBySpecies = normalUnits.filter((unit) => unit.species === species);

  // 특정 티어의 유닛 필터링
  const unitsByTier = unitsBySpecies.filter((unit) => unit.tier === tier);

  // 필터링된 유닛에서 랜덤으로 하나 선택
  const randomIndex = Math.floor(Math.random() * unitsByTier.length); // 1티어는 0~2, 2티어는 0~1, 3티어는 0
  return unitsByTier[randomIndex].id;
};

export default drawCardRequest;
