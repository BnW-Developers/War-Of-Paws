/**
 * 유닛이 목적지에 도착했는지 확인 후 결과를 반환
 * @param {Unit} unit
 * @param {{x: float, z: float}} pos
 * @returns boolean
 */
const arrivedAtDest = (unit, pos) => {
  const { area } = unit.getDestination();

  const arrived =
    pos.x >= area[0].x && // 서쪽 변 체크
    pos.z <= area[0].z && // 북쪽 변 체크
    pos.x <= area[2].x && // 동쪽 변 체크
    pos.z >= area[2].z; // 남쪽 변 체크

  return arrived;
};

export default arrivedAtDest;
