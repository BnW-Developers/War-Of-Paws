export const errCodes = {
  // 패킷 및 페이로드 관련 에러
  SOCKET_ERR: 10000, // 소켓 연결 오류
  CLIENT_VERSION_MISMATCH: 10001, // 클라이언트 버전 불일치
  UNKNOWN_PACKET_TYPE: 10002, // 알 수 없는 패킷 유형
  PACKET_DECODE_ERR: 10003, // 패킷 디코딩 오류
  PACKET_STRUCTURE_MISMATCH: 10004, // 패킷 구조 불일치
  MISSING_FIELDS: 10005, // 필수 필드 누락
  INVALID_PACKET: 10006, // 잘못된 패킷

  // Register 관련 에러
  DUPLICATE_USER_ID: 10100, // 중복된 사용자 ID
  EMAIL_ALREADY_IN_USE: 10101, // 이미 사용 중인 이메일
  INVALID_PASSWORD_FORMAT: 10102, // 비밀번호 형식 위반

  // Login 관련 에러
  INVALID_CREDENTIALS: 10200, // 잘못된 사용자 ID 또는 비밀번호
  ACCOUNT_NOT_VERIFIED: 10201, // 일치하는 계정 없음

  // Match 관련 에러
  MATCH_NOT_FOUND: 10300, // 매칭 상대를 찾을 수 없음
  MATCH_TIMEOUT: 10301, // 매칭 요청 시간 초과

  // Game Start 관련 에러
  GAME_ALREADY_STARTED: 10400, // 게임이 이미 시작됨
  GAME_NOT_READY: 10401, // 게임 시작 준비가 안 됨

  // Building Purchase 관련 에러
  BUILDING_INSUFFICIENT_FUNDS: 10500, // 자금 부족
  ASSET_NOT_FOUND: 10501, // 구매하려는 건물을 찾을 수 없음

  // Unit Spawn 관련 에러
  INVALID_ASSET_ID: 10600, // 잘못된 유닛 ID
  UNIT_INSUFFICIENT_FUNDS: 10601, // 자금 부족

  // Attack 관련 에러
  UNIT_NOT_FOUND: 10700, // 공격하려는 유닛을 찾을 수 없음
  OPPONENT_NOT_FOUND: 10701, // 상대 유닛을 찾을 수 없음

  // Occupation 관련 에러
  CHECKPOINT_NOT_FOUND: 10800, // 체크포인트를 찾을 수 없음
  OCCUPATION_IN_PROGRESS: 10801, // 이미 점령 중

  // Game End 관련 에러
  GAME_NOT_ACTIVE: 10900, // 게임이 활성화되어 있지 않음
  INVALID_GAME_STATE: 10901, // 잘못된 게임 상태

  // Location 관련 에러
  INVALID_LOCATION_DATA: 11000, // 잘못된 위치 데이터
  LOCATION_UPDATE_FAILED: 11001, // 위치 업데이트 실패
};
