import { PACKET_TYPE } from '../constants/header.js';

export const MARK_1 = [
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
    duration: 10000,
  },
];

export const MARK_2 = [];
