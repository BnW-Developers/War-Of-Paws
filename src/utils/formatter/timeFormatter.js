const formatTime = (timestamp, includeDate = true) => {
  if (typeof timestamp !== 'string') timestamp = Number(timestamp);
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = date.getHours();
  const minutes = '0' + date.getMinutes();
  const seconds = '0' + date.getSeconds();
  const milliseconds = '0' + date.getMilliseconds();

  // 10:30:23.927
  const formattedTime =
    year +
    '-' +
    month +
    '-' +
    day +
    ' ' +
    hours +
    ':' +
    minutes.substr(-2) +
    ':' +
    seconds.substr(-2) +
    '.' +
    milliseconds.substr(-3);

  return includeDate ? formattedTime : formattedTime.split(' ')[1];
};

export default formatTime;
