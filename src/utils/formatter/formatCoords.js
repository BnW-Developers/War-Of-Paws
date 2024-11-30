import round from '../math/round.js';

const formatCoords = (coords, roundTo) => {
  const x = round(coords.x, roundTo);
  const z = round(coords.z, roundTo);
  return `(${x},${z})`;
};

export default formatCoords;
