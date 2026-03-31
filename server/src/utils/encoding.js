function decodeRepeatedly(value) {
  let currentValue = value;

  for (let index = 0; index < 4; index += 1) {
    try {
      const decoded = decodeURIComponent(currentValue);
      if (decoded === currentValue) {
        break;
      }

      currentValue = decoded;
    } catch {
      break;
    }
  }

  return currentValue;
}

module.exports = {
  decodeRepeatedly,
};
