/** Round to 2 decimal places using integer cents to avoid binary float drift. */
function toMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function addMoney(...values) {
  return toMoney(values.reduce((sum, v) => sum + toMoney(v), 0));
}

module.exports = { toMoney, addMoney };
