import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../logger.js';
import { blockList } from '../../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'banned_ips.json');

export function readBanList() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error reading the ban list:', error);
    return null;
  }
}

function writeBanList(banList) {
  try {
    const data = JSON.stringify(banList, null, 2);
    fs.writeFileSync(filePath, data, 'utf8');
  } catch (error) {
    logger.error('Error write the ban list:', error);
    return null;
  }
}

export const addBanList = (socket) => {
  const remoteAddress = socket.remoteAddress;
  blockList.addAddress(remoteAddress);

  const banList = readBanList() || { banned_ips: [] };

  banList.banned_ips.push({ ip: remoteAddress });
  writeBanList(banList);
  logger.info(`${remoteAddress} - banned`);
  socket.destroy();
  socket.end();
};
