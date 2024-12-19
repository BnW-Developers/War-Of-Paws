import { PACKET_TYPE } from '../constants/header.js';

export const MARK_1 = [
  {
    packetType: PACKET_TYPE.DRAW_CARD_REQUEST,
    payload: {},
    duration: 2000,
  },

  {
    packetType: PACKET_TYPE.SPAWN_UNIT_REQUEST,
    payload: {},
    duration: 0,
  },
  {
    packetType: PACKET_TYPE.LOCATION_NOTIFICATION,
    payload: {},
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
