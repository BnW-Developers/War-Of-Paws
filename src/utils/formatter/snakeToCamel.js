export const snakeToCamel = (snakeCaseName) => {
  const parts = snakeCaseName.split('_');
  const firstPart = parts.shift().toLowerCase();
  const camelCaseName = parts.reduce((accumulator, currentPart) => {
    const lowerPart = currentPart.toLowerCase();
    const firstChar = lowerPart[0].toUpperCase();
    const remainingStr = lowerPart.slice(1, lowerPart.length);
    return accumulator + firstChar + remainingStr;
  }, '');
  return firstPart + camelCaseName;
};
