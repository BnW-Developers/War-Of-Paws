/**
 * 두 좌표 사이의 직선거리를 스칼라값으로 반환
 * @param {{x: float, y: float, z: float}} pos1
 * @param {{x: float, y: float, z: float}} pos2
 * @returns {float}
 */
const calculateDistance = (pos1, pos2) => {
  // 검증: 좌표의 형식이 올바른가?
  if (!pos1 || !pos1.x || !pos1.y || !pos1.z) {
    throw new Error('잘못된 좌표입니다: pos1', pos1);
  }

  if (!pos2 || !pos2.x || !pos2.y || !pos2.z) {
    throw new Error('잘못된 좌표입니다: pos1', pos2);
  }

  // √((x1-x2)^2 + (y1-y2)^2 + (z1-z2)^2)
  return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2 + (pos1.z - pos2.z) ** 2);
};

export default calculateDistance;
