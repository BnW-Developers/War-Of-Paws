import { config } from '../../config/config.js';
import { hashed } from '../auth/hashed.js';
import logger from '../log/logger.js';

export const requestIpBan = async (ip, comment) => {
  try {
    logger.info(`${ip} - Block request`);
    const url = config.server.nginx;
    const key = await hashed(config.auth.api_key);
    const response = await fetch(url, {
      method: 'POST', // HTTP 메서드: POST
      headers: {
        'Content-Type': 'application/json', // JSON 데이터 전송
        authorization: key,
      },
      body: JSON.stringify({ ip, comment }), // 데이터를 JSON 문자열로 변환하여 전송
    });

    if (!response.ok) {
      console.log(response);
      throw new Error('nginx 서버 요청 오류');
    }
  } catch (err) {
    logger.warn(err.message);
  }
};
