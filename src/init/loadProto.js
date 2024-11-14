import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import protobuf from 'protobufjs';
import { formatDate } from '../utils/formatter/dateFormatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const protoDir = path.join(__dirname, '../protobuf');

const getAllProto = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllProto(filePath, fileList);
    } else if (path.extname(file) === '.proto') {
      fileList.push(filePath);
    }
  });
  return fileList;
};

const protoFiles = getAllProto(protoDir);
let root;
export let GamePacket;
export let GlobalFailCode;
const protoMessages = {};

export const loadProtos = async () => {
  try {
    root = new protobuf.Root();
    await Promise.all(
      protoFiles.map(async (file) => {
        try {
          await root.load(file);
        } catch (loadError) {
          console.error(`Error loading proto file ${file}:`, loadError);
        }
      }),
    );

    getTypes(root);
    GamePacket = root.lookupType('GamePacket');
    GlobalFailCode = root.lookupEnum('GlobalFailCode');

    const date = new Date();
    console.log(`[${formatDate(date)} - LOAD] Success to load protobuf files`);
  } catch (err) {
    const date = new Date();
    console.error(`[${formatDate(date)} - FAIL] Fail to load protobuf files:`, err);
  }
};

function getTypes(root, prefix = '') {
  Object.keys(root.nested).forEach((key) => {
    const nestedObject = root.nested[key];
    const fullName = prefix ? `${prefix}.${key}` : key;

    if (nestedObject.nested) {
      getTypes(nestedObject, fullName);
    } else if (nestedObject instanceof protobuf.Type) {
      const [packageName, type] = fullName.split('.');
      if (!protoMessages[packageName]) protoMessages[packageName] = {};
      protoMessages[packageName][type] = nestedObject;
    }
  });
}

export const getProtoMessages = () => {
  return { ...protoMessages };
};
