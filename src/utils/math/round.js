const round = (number, roundTo) => {
  const multiplier = 10 ** roundTo;
  return Math.round((number + Number.EPSILON) * multiplier) / multiplier;
};

export default round;
