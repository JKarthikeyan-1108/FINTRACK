function toMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function calcEMI(principal, annualRate, months) {
  const p = toMoney(principal);
  const n = Number(months);
  const rAnnual = Number(annualRate);
  if (!(p > 0) || !(n > 0) || n > 600) return 0;
  if (!(rAnnual > 0)) return toMoney(p / n);
  const r = rAnnual / 12 / 100;
  const pow = Math.pow(1 + r, n);
  return toMoney((p * r * pow) / (pow - 1));
}

export function simpleInterest(principal, annualRate, years) {
  return toMoney(toMoney(principal) * Number(annualRate) * Number(years) / 100);
}

export function compoundAmount(principal, annualRate, years, compoundsPerYear = 1) {
  const p = toMoney(principal);
  const n = Number(compoundsPerYear) || 1;
  const t = Number(years);
  const r = Number(annualRate) / 100;
  if (!(p >= 0) || !(t >= 0) || n <= 0) return p;
  return toMoney(p * Math.pow(1 + r / n, n * t));
}

export function sipFutureValue(monthly, annualRate, months) {
  const m = toMoney(monthly);
  const n = Number(months);
  if (!(m > 0) || !(n > 0)) return 0;
  const i = Number(annualRate) / 12 / 100;
  if (!(i > 0)) return toMoney(m * n);
  return toMoney(m * ((Math.pow(1 + i, n) - 1) / i) * (1 + i));
}

export function monthlySavingsRequired(target, alreadySaved, monthsRemaining) {
  const need = toMoney(Math.max(0, toMoney(target) - toMoney(alreadySaved)));
  const n = Number(monthsRemaining);
  if (!(n > 0)) return need;
  return toMoney(need / n);
}

export function runMonteCarloSimulation({
  initialInvestment = 500000,
  monthlyContribution = 15000,
  years = 10,
  expectedReturn = 12,
  volatility = 15,
  inflation = 6,
  simulationsCount = 200,
} = {}) {
  const init = toMoney(initialInvestment);
  const monthly = toMoney(monthlyContribution);
  const numYears = Math.min(30, Math.max(1, Number(years || 10)));
  const muAnnual = Number(expectedReturn || 12) / 100;
  const sigmaAnnual = Number(volatility || 15) / 100;
  const infAnnual = Number(inflation || 6) / 100;

  const dt = 1 / 12; // monthly steps
  const totalMonths = numYears * 12;
  const muMonth = (muAnnual - 0.5 * sigmaAnnual * sigmaAnnual) * dt;
  const sigmaMonth = sigmaAnnual * Math.sqrt(dt);

  function randomNormal() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  const yearlyTrajectories = [];
  const finalValues = [];

  for (let sim = 0; sim < simulationsCount; sim++) {
    let balance = init;
    const trajectory = [balance];

    for (let m = 1; m <= totalMonths; m++) {
      const z = randomNormal();
      const returnFactor = Math.exp(muMonth + sigmaMonth * z);
      balance = (balance + monthly) * returnFactor;
      if (m % 12 === 0) {
        trajectory.push(Math.round(balance));
      }
    }
    yearlyTrajectories.push(trajectory);
    finalValues.push(balance);
  }

  finalValues.sort((a, b) => a - b);
  const idx10 = Math.floor(simulationsCount * 0.1);
  const idx50 = Math.floor(simulationsCount * 0.5);
  const idx90 = Math.floor(simulationsCount * 0.9);

  const bearFinal = finalValues[idx10];
  const medianFinal = finalValues[idx50];
  const bullFinal = finalValues[idx90];

  const totalInvested = init + (monthly * totalMonths);
  const inflationFactor = Math.pow(1 + infAnnual, numYears);
  const realPurchasingPower = Math.round(medianFinal / inflationFactor);

  const yearlyPercentiles = [];
  for (let y = 0; y <= numYears; y++) {
    const yearVals = yearlyTrajectories.map(t => t[y]).sort((a, b) => a - b);
    yearlyPercentiles.push({
      year: y,
      label: y === 0 ? 'Today' : `Yr ${y}`,
      bear: yearVals[idx10] || 0,
      median: yearVals[idx50] || 0,
      bull: yearVals[idx90] || 0,
    });
  }

  return {
    totalInvested: Math.round(totalInvested),
    medianFinal: Math.round(medianFinal),
    bearFinal: Math.round(bearFinal),
    bullFinal: Math.round(bullFinal),
    realPurchasingPower,
    inflationErosionPct: Math.round(((medianFinal - realPurchasingPower) / medianFinal) * 100),
    yearlyPercentiles,
  };
}

export { toMoney };
