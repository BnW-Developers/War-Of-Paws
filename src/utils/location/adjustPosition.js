/**
 * 클라이언트가 보낸 유닛의 위치값을 보정하여 보정된 위치값을 반환
 * @param {[x: float, y: float, z: float]} actualPos
 * @param {[x: float, y: float, z: float]} expectedPos
 * @param {[x: float, y: float, z: float]} marginOfErr
 * @return {{adjustedPos: {x: float, y: float, z: float}, modified: boolean}}
 */
const adjustPos = (actualPos, expectedPos, marginOfErr) => {
  // 검증: 좌표의 형식이 올바른가?
  if (!actualPos || actualPos.length != 3) {
    throw new Error('잘못된 좌표입니다: actualPos', actualPos);
  }
  if (!expectedPos || expectedPos.length != 3) {
    throw new Error('잘못된 좌표입니다: expectedPos', expectedPos);
  }
  if (!marginOfErr || marginOfErr.length != 3) {
    throw new Error('잘못된 좌표입니다: marginOfErr', marginOfErr);
  }

  const adjustedPos = [];
  let modified = false;

  for (let dir = 0; dir < 3; dir++) {
    const withinLowerBound = expectedPos[dir] - marginOfErr[dir] <= actualPos[dir];
    const withinUpperBound = actualPos[dir] <= expectedPos[dir] + marginOfErr[dir];
    const validPosition = withinLowerBound && withinUpperBound;

    // 오차범위 내일 경우 클라이언트가 보낸 위치값을 실값으로 인정
    if (validPosition) {
      adjustedPos[dir] = actualPos[dir];
      // 오차범위 밖일 경우 서버의 계산값을 실값으로 처리
    } else {
      adjustedPos[dir] = expectedPos[dir];
      modified = true; // 해당 좌표가 보정되었는지 여부
    }
  }

  // 배열 -> 객체로 형식을 변경한 뒤 반환
  return {
    adjustedPos: { x: adjustedPos[0], y: adjustedPos[1], z: adjustedPos[2] },
    modified,
  };
};

export default adjustPos;
