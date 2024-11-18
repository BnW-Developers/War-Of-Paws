import winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * 로그 메시지 형식을 정의합니다.
 * 로그 레벨, 타임스탬프, 메시지를 포함하는 문자열을 반환합니다.
 * @param {Object} param - 로그 정보 객체
 * @param {string} param.timestamp - 로그 타임스탬프
 * @param {string} param.level - 로그 레벨 (info, error 등)
 * @param {string} param.message - 로그 메시지
 * @returns {string} - 포맷된 로그 메시지
 */
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

/**
 * DailyRotateFile 트랜스포트를 설정합니다.
 * 매일 새로운 로그 파일을 생성하며, 최대 120개의 로그 파일을 보관하고 오래된 파일은 삭제합니다.
 * 또한, 로그 파일을 압축하여 저장합니다.
 * @type {winston.transports.DailyRotateFile}
 */
const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log', // 로그 파일명에 날짜를 포함
  datePattern: 'YYYY-MM-DD-HH', // 로그 파일에 적용할 날짜 패턴
  maxFiles: '120', // 120개의 파일까지만 보관
  zippedArchive: true, // 로그 파일 압축
});

/**
 * winston 로거를 생성합니다.
 * 'info' 레벨 이상의 로그를 기록하며, 로그는 파일과 콘솔에 동시에 출력됩니다.
 *
 * 사용 예시:
 * - logger.info(message);   // console.log와 동일
 * - logger.warn(message);   // 에러는 아니지만 문제되는 상황
 * - logger.error(message);  // console.error와 동일
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level: 'info', // 로그 레벨 설정
  format: winston.format.combine(
    winston.format.timestamp(), // 타임스탬프 추가
    logFormat, // 로그 형식 적용
  ),
  transports: [
    transport, // 파일에 로그 저장
    new winston.transports.Console(), // 콘솔에 로그 출력
  ],
});

export default logger;
