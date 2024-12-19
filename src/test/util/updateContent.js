import { PACKET_TYPE } from '../../constants/header.js';
import { CURRENT_TEST, UNIT_TEST } from '../constants/testSwitch.js';

const updateContent = (contents) => {
  switch (CURRENT_TEST) {
    case UNIT_TEST.DRAW_CARD: {
      const content = contents.find(
        (content) => content.packetType === PACKET_TYPE.DRAW_CARD_REQUEST,
      );

      const buttonType = Math.floor(Math.random() * 3) + 1;
      content.payload = { buttonType };
      break;
    }
    case UNIT_TEST.EXCEED_MAX_SLOTS: {
      const content = contents.find(
        (content) => content.packetType === PACKET_TYPE.DRAW_CARD_REQUEST,
      );

      const buttonType = Math.floor(Math.random() * 3) + 1;
      content.payload = { buttonType };
      break;
    }
    default: {
      break;
    }
  }
};

export default updateContent;
