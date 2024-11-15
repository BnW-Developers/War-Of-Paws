import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { formatDate } from '../utils/formatter/dateFormatter.js';
// 현재 파일의 경로와 디렉토리를 가져옴
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const handlerDir = path.join(__dirname, '../handlers'); // .proto 파일들이 있는 디렉토리 경로 설정

// 주어진 디렉토리에서 핸들러 파일을 재귀적으로 검색하여 함수 목록 반환
const getAllHandler = (dir, fileList = []) => {
  const files = fs.readdirSync(dir); // 주어진 디렉토리 내 모든 파일과 폴더 목록 읽기
  files.forEach((file) => {
    const filePath = path.join(dir, file);

    // 하위 디렉토리가 있으면 재귀적으로 호출하여 핸들러 파일 검색
    if (fs.statSync(filePath).isDirectory()) {
      getAllHandler(filePath, fileList);
    } else if (path.extname(file) === '.js') {
      fileList.push(filePath); // 핸들러 파일 경로를 fileList 배열에 추가
    }
  });

  return fileList; // 모든 핸들러 함수를 반환
};

const handlers = {};

// .proto 파일 목록 가져오기
const handlersPath = getAllHandler(handlerDir);

// 모든 핸들러 파일을 handlers 객체에 저장
export const loadHandlers = async () => {
  try {
    await Promise.all(
      handlersPath.map(async (file) => {
        const fileFullName = path.basename(file);
        const fileName = fileFullName.split('.')[0];
        const module = await import(pathToFileURL(file).href);

        if (module.default) {
          handlers[fileName] = module.default;
        } else {
          handlers[fileName] = module;
        }
      }),
    );

    const date = new Date();
    console.log(`[${formatDate(date)} - LOAD] Success to load Handler files`);
  } catch (err) {
    const date = new Date();
    console.log(err);
    console.error(`[${formatDate(date)} - FAIL] Fail to load Handler files`);
  }
};

export const getHandlers = () => {
  return { ...handlers };
};
