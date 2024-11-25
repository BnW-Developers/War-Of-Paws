import { PACKET_TYPE } from '../constants/header.js';

export const MARK_1 = [
  {
    packetType: PACKET_TYPE.REGISTER_REQUEST,
    payload: { id: '5002', password: '1234', email: 'test@naver.com' },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.LOGIN_REQUEST,
    payload: { id: '5002', password: '1234' },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.MATCH_REQUEST,
    payload: { species: 'CAT' },
    duration: 3000,
  },
  {
    packetType: PACKET_TYPE.GAME_START_REQUEST,
    payload: { timestamp: Date.now() },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.SPAWN_UNIT_REQUEST,
    payload: { assetId: 2001, toTop: false },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.ENTER_CHECKPOINT_NOTIFICATION,
    payload: {},
    duration: 10000,
  },
  {
    packetType: PACKET_TYPE.ATTACK_BASE_REQUEST,
    payload: {},
    duration: 1000,
  },
];

export const MARK_2 = [
  {
    packetType: PACKET_TYPE.REGISTER_REQUEST,
    payload: { id: '5001', password: '1234', email: 'test@naver.com' },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.LOGIN_REQUEST,
    payload: { id: '5001', password: '1234' },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.MATCH_REQUEST,
    payload: { species: 'DOG' },
    duration: 3000,
  },
  {
    packetType: PACKET_TYPE.GAME_START_REQUEST,
    payload: { timestamp: Date.now() },
    duration: 1000,
  },
];
