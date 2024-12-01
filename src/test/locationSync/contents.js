import { PACKET_TYPE } from '../../constants/header.js';

export const LOCATION_SYNC_TEST_1 = [
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
  {
    packetType: PACKET_TYPE.SPAWN_UNIT_REQUEST,
    payload: { assetId: 2001, toTop: false, timestamp: Date.now() },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.LOCATION_NOTIFICATION,
    payload: {},
    duration: 1000,
  },
];

export const LOCATION_SYNC_TEST_2 = [
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
    payload: { assetId: 2007, toTop: true, timestamp: Date.now() },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.LOCATION_NOTIFICATION,
    payload: {},
    duration: 1000,
  },
];

export const LOCATION_SYNC_TEST_3 = [
  {
    packetType: PACKET_TYPE.REGISTER_REQUEST,
    payload: { id: '5003', password: '1234', email: 'test@naver.com' },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.LOGIN_REQUEST,
    payload: { id: '5003', password: '1234' },
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
  {
    packetType: PACKET_TYPE.SPAWN_UNIT_REQUEST,
    payload: { assetId: 2001, toTop: false, timestamp: Date.now() },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.LOCATION_NOTIFICATION,
    payload: {},
    duration: 1000,
  },
];

export const LOCATION_SYNC_TEST_4 = [
  {
    packetType: PACKET_TYPE.REGISTER_REQUEST,
    payload: { id: '5004', password: '1234', email: 'test@naver.com' },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.LOGIN_REQUEST,
    payload: { id: '5004', password: '1234' },
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
    payload: { assetId: 2007, toTop: true, timestamp: Date.now() },
    duration: 1000,
  },
  {
    packetType: PACKET_TYPE.LOCATION_NOTIFICATION,
    payload: {},
    duration: 1000,
  },
];
