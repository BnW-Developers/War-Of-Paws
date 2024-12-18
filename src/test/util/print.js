import formatTime from '../utils/formatter/timeFormatter.js';
import chalk from 'chalk';

export const printHeader = (tag, outgoing = false, error = false) => {
  const timestamp = Date.now();

  let header = `[${tag}] ${formatTime(timestamp, false)}`;

  if (outgoing) {
    header = '     ' + header;
  }
  if (error) {
    header = chalk.redBright(header);
  }

  console.log(header);
  return timestamp;
};

export const printMessage = (message, outgoing = false, error = false) => {
  if (outgoing) {
    message = '     ' + message;
  }
  if (error) {
    message = chalk.redBright(message);
  }
  console.log(message);
};
