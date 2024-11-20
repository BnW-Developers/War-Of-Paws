import { ASSET_TYPE } from '../../constants/assets.js';
import { gameAssets } from '../../init/loadAssets.js';
import CustomErr from '../error/customErr.js';
import { errCodes } from '../error/errCodes';

/**
 * 로드한 게임에셋 전체를 조회하는 함수
 * @returns {{buildings: {}, units: {}}} JSON화된 모든 게임에셋
 */
export const getAllGameAssets = () => {
  return gameAssets;
};

/**
 * 특정 게임에셋을 조회하는 함수
 *
 * 호출 예시: const units = getGameAsset(ASSET_TYPE.UNIT);
 * @param {ASSET_TYPE} assetType 조회할 게임에셋 타입
 * @returns {{name: string, version: string, data: {}}}} JSON화된 게임에셋
 */
export const getGameAsset = (assetType) => {
  const { buildings, units } = getAllGameAssets();

  switch (assetType) {
    case ASSET_TYPE.BUILDING:
      return buildings;
    case ASSET_TYPE.UNIT:
      return units;
    default:
      throw CustomErr(errCodes.INVALID_ASSET_TYPE, '올바르지 않은 게임에셋 타입입니다:', assetType);
  }
};

/**
 * 게임에셋의 특정 데이터를 id로 조회하는 함수
 *
 * 호출 예시: const unitData = getGameAssetById(ASSET_TYPE.UNIT, 2001);
 * @param {ASSET_TYPE} assetType 조회할 게임에셋 타입
 * @param {string} id 조회할 항목의 id
 * @returns {JSON} 해당 id의 데이터 ( 예시: { id: 2003, DisplayName: "마법사", ... } )
 */
export const getGameAssetById = (assetType, id) => {
  const { buildings, units } = getAllGameAssets();

  switch (assetType) {
    case ASSET_TYPE.BUILDING:
      return buildings.data.find((building) => building.id === id);
    case ASSET_TYPE.UNIT:
      return units.data.find((unit) => unit.id === id);
    default:
      throw CustomErr(errCodes.INVALID_ASSET_TYPE, '올바르지 않은 게임에셋 타입입니다:', assetType);
  }
};
