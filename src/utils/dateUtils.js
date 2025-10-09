function getMonthStart(dt = new Date()) {
  return new Date(dt.getFullYear(), dt.getMonth(), 1, 0, 0, 0, 0);
}

function getMonthEnd(dt = new Date()) {
  return new Date(dt.getFullYear(), dt.getMonth() + 1, 0, 23, 59, 59, 999);
}

module.exports = { getMonthStart, getMonthEnd };
