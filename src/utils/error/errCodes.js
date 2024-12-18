export const ERR_CODES = {
  // 패킷 및 페이로드 관련 에러
  SOCKET_ERR: 10000, // 소켓 연결 오류
  CLIENT_VERSION_MISMATCH: 10001, // 클라이언트 버전 불일치
  UNKNOWN_PACKET_TYPE: 10002, // 알 수 없는 패킷 유형
  PACKET_DECODE_ERR: 10003, // 패킷 디코딩 오류
  PACKET_STRUCTURE_MISMATCH: 10004, // 패킷 구조 불일치
  MISSING_FIELDS: 10005, // 필수 필드 누락
  INVALID_PACKET: 10006, // 잘못된 패킷
  HANDLER_NOT_FOUND: 10007, // 핸들러를 찾을 수 없음
  NULL_FIELD: 10008, // 필드값이 NULL

  // Register 관련 에러
  DUPLICATE_USER_ID: 10100, // 중복된 사용자 ID
  INVALID_REGISTER_FORMAT: 10102, // PAYLOAD 형식 위반

  // Login 관련 에러
  INVALID_CREDENTIALS: 10200, // 잘못된 사용자 ID 또는 비밀번호
  ALREADY_LOGIN: 10201, // 이미 로그인 된 계정
  INVALID_GOOGLE_TOKEN: 10210, // 구글 토큰 정보와 불일치
  EXPIRED_GOOGLE_TOKEN: 10211, // 구글 토큰 유효성 오류

  // Match 관련 에러
  MATCH_NOT_FOUND: 10300, // 매칭 상대를 찾을 수 없음
  MATCH_TIMEOUT: 10301, // 매칭 요청 시간 초과

  // Game Start 관련 에러
  GAME_ALREADY_STARTED: 10400, // 게임이 이미 시작됨
  GAME_NOT_READY: 10401, // 게임 시작 준비가 안 됨
  GAME_CANCELED: 10402, // 게임 취소

  // Building Purchase 관련 에러
  BUILDING_INSUFFICIENT_FUNDS: 10500, // 자금 부족
  ASSET_NOT_FOUND: 10501, // 구매하려는 건물을 찾을 수 없음

  // Unit Spawn 관련 에러
  INVALID_ASSET_ID: 10600, // 잘못된 유닛 ID
  UNIT_INSUFFICIENT_FUNDS: 10601, // 자금 부족

  // Attack 관련 에러
  UNIT_NOT_FOUND: 10700, // 공격하려는 유닛을 찾을 수 없음
  OPPONENT_NOT_FOUND: 10701, // 상대 유닛을 찾을 수 없음
  FRIENDLY_FIRE: 10702, // 아군 오인사격
  TREASON: 10703, // 적에게 힐 또는 버프를 시도함
  ATTACK_ON_COOLDOWN: 10705,
  OUT_OF_RANGE: 10706, // 사거리 초과
  ATTACK_VALIDATION_FAILED: 10707,

  // Heal & Buff 관련 에러
  UNIT_CLASS_MISMATCH: 10708, // 유닛 클래스가 일치하지 않음

  // Occupation 관련 에러
  CHECKPOINT_NOT_FOUND: 10800, // 체크포인트를 찾을 수 없음
  OCCUPATION_IN_PROGRESS: 10801, // 이미 점령 중
  DUPLICATE_UNIT_IN_CHECKPOINT: 10802, // 이미 체크포인트에 들어가있는 유저임
  UNOCCUPIED_STATE_CHECKPOINT: 10803, // 체크포인트 미점령 상태
  NOT_FOUND_UNIT_IN_CHECKPOINT: 10804, // 체크포인트에 들어오지 않은 유닛입니다.

  // Game End 관련 에러
  GAME_NOT_ACTIVE: 10900, // 게임이 활성화되어 있지 않음
  INVALID_GAME_STATE: 10901, // 잘못된 게임 상태

  // Location 관련 에러
  INVALID_LOCATION_DATA: 11000, // 잘못된 위치 데이터
  LOCATION_UPDATE_FAILED: 11001, // 위치 업데이트 실패
  UNOWNED_UNIT: 11002, // 유저가 보유하지 않은 유닛
  INVALID_TIME: 11003, // 잘못된 시간값
  INVALID_DIRECTION: 11004, // 잘못된 공격로 타입

  // GameSession 관련 에러
  GAME_NOT_FOUND: 11100, // 유저가 플레이중인 게임을 찾지 못함
  GAME_NOT_IN_PROGRESS: 11101, // 현재 진행중인 게임이 아님
  PLAYER_GAME_DATA_NOT_FOUND: 11102, // 유저의 게임 데이터를 찾지 못함
  OPPONENT_GAME_DATA_NOT_FOUND: 11103, // 상대방의 게임 데이터를 찾지 못함
  OPPONENT_SOCKET_NOT_FOUND: 11104, // 상대방의 소켓을 찾지 못함

  // UserSession 관련 에러
  USER_NOT_FOUND: 11200, // 유저를 찾지 못함

  // 게임에셋 관련 에러
  INVALID_ASSET_TYPE: 11300, // 잘못된 에셋 타입

  // Game과 User Session 관련 에러
  GAME_SESSION_NOT_FOUND: 11400, // 게임 세션을 찾을 수 없음
  USER_SESSION_NOT_FOUND: 11401, // 유저 세션을 찾을 수 없음

  // 카드 관련
  INVALID_BUTTON_TYPE: 11500,
  MAX_CARDS_REACHED: 115001,

  // 스펠 관련
  SPELL_INSUFFICIENT_FUNDS: 11600, // 자금 부족
  SPELL_ON_COOLDOWN: 11601, // 쿨타임 대기중
};
