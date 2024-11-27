import { ASSET_TYPE } from '../../constants/assets.js';
import { gameAssets } from '../../init/loadAssets.js';
import CustomErr from '../error/customErr.js';
import { ERR_CODES } from '../error/errCodes.js';
import { SPECIES, DIRECTION } from '../../constants/assets.js';

/**
 * 로드한 게임에셋 전체를 조회하는 함수
 * @returns {{buildings: {}, maps: {}, paths: {}, units: {}}} JSON화된 모든 게임에셋
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
  const { buildings, maps, paths, units } = getAllGameAssets();

  switch (assetType) {
    case ASSET_TYPE.BUILDING:
      return buildings;
    case ASSET_TYPE.MAP:
      return maps;
    case ASSET_TYPE.PATH:
      return paths;
    case ASSET_TYPE.UNIT:
      return units;
    default:
      throw CustomErr(
        ERR_CODES.INVALID_ASSET_TYPE,
        '올바르지 않은 게임에셋 타입입니다:',
        assetType,
      );
  }
};

/**
 * 게임에셋의 특정 데이터를 id로 조회하는 함수
 *
 * 호출 예시: const unitData = getGameAssetById(ASSET_TYPE.UNIT, 2003);
 * @param {ASSET_TYPE} assetType 조회할 게임에셋 타입
 * @param {string} id 조회할 항목의 id
 * @returns {JSON} 해당 id의 데이터 ( 예시: { id: 2003, DisplayName: "불 테리어", ... } )
 */
export const getGameAssetById = (assetType, id) => {
  const { buildings, maps, paths, units } = getAllGameAssets();

  switch (assetType) {
    case ASSET_TYPE.BUILDING:
      return buildings.data.find((building) => building.id === id);
    case ASSET_TYPE.MAP:
      return maps.data.find((map) => map.id === id);
    case ASSET_TYPE.PATH:
      return paths.data.find((path) => path.id === id);
    case ASSET_TYPE.UNIT:
      return units.data.find((unit) => unit.id === id);
    default:
      throw CustomErr(
        ERR_CODES.INVALID_ASSET_TYPE,
        '올바르지 않은 게임에셋 타입입니다:',
        assetType,
      );
  }
};

/**
 * 진영과 방향에 부합하는 경로를 반환
 *
 * 호출 예시: const path = getPath(SPECIES.DOG, DIRECTION.UP);
 * @param {SPECIES} species 진영 (개 또는 고양이)
 * @param {DIRECTION} direction 소환위치 (위 또는 아래)
 * @returns {{x: float, y: float, z: float}[]} 경로
 */
export const getPath = (species, direction) => {
  // 검증: 파라미터 유효성
  if (!Object.values(SPECIES).includes(species)) {
    throw new CustomErr(ERR_CODES.INVALID_ASSET_TYPE, '올바르지 않은 종족입니다:', species);
  }
  if (!Object.values(DIRECTION).includes(direction)) {
    throw new CustomErr(ERR_CODES.INVALID_ASSET_TYPE, '올바르지 않은 방향입니다:', direction);
  }

  const { paths } = getGameAsset(ASSET_TYPE.PATH);
  const pathData = paths.data.find(
    (path) => path.species === species && path.direction === direction,
  );
  return pathData.path;
};

/**
 * 경로에 맞는 모퉁이 영역 좌표를 반환
 *
 * 호출 예시: const corners = getCorners(SPECIES.DOG, DIRECTION.UP);
 * @param {SPECIES} species 진영 (개 또는 고양이)
 * @param {DIRECTION} direction 소환위치 (위 또는 아래)
 * @returns {[{x: float, y: float, z: float}, {x: float, y: float, z: float}, {x: float, y: float, z: float}, {x: float, y: float, z: float}][]} 모퉁이 영역의 배열
 */
export const getCorners = (species, direction) => {
  // 검증: 파라미터 유효성
  if (!Object.values(SPECIES).includes(species)) {
    throw new CustomErr(ERR_CODES.INVALID_ASSET_TYPE, '올바르지 않은 종족입니다:', species);
  }
  if (!Object.values(DIRECTION).includes(direction)) {
    throw new CustomErr(ERR_CODES.INVALID_ASSET_TYPE, '올바르지 않은 방향입니다:', direction);
  }

  // TODO: 다수의 맵을 지원할 시 패킷명세, 게임세션 등 코드수정이 필요
  // 현재는 하나의 맵만 지원하므로 해당 ID (5001)를 하드코딩
  const mapData = getGameAssetById(ASSET_TYPE.MAP, 5001);

  if (species === SPECIES.DOG && direction === DIRECTION.UP) {
    return [mapData.NWCorner, mapData.NECorner];
  } else if (species === SPECIES.DOG && direction === DIRECTION.DOWN) {
    return [mapData.SWCorner, mapData.SECorner];
  } else if (species === SPECIES.CAT && direction === DIRECTION.UP) {
    return [mapData.NECorner, mapData.NWCorner];
  } else if (species === SPECIES.CAT && direction === DIRECTION.DOWN) {
    return [mapData.SECorner, mapData.SWCorner];
  }
};
