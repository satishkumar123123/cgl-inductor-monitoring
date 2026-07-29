const DailyPowerConsumption = require("../models/DailyPowerConsumption");
const DailyInductorData = require("../models/DailyInductorData");

function buildDateQuery({ from, to, month, year }) {
  const query = {};
  if (year && month) {
    const mm = String(month).padStart(2, "0");
    query.date = { $gte: `${year}-${mm}-01`, $lte: `${year}-${mm}-31` };
  } else if (year) {
    query.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
  } else if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }
  return query;
}

/** Average Inductor PF across every High/Intermediate reading in both pots for one day. */
function avgInductorPF(doc) {
  const values = [];
  ["mainPot", "pmPot"].forEach((potKey) => {
    const pot = doc[potKey];
    if (!pot) return;
    const potObj = pot.toObject ? pot.toObject() : pot;
    Object.keys(potObj).forEach((ind) => {
      ["high", "intermediate"].forEach((level) => {
        const pf = potObj[ind]?.[level]?.inductorPF;
        if (pf) values.push(pf);
      });
    });
  });
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

const avg = (arr, key) => (arr.length ? arr.reduce((a, r) => a + r[key], 0) / arr.length : 0);
const maxBy = (arr, key) => (arr.length ? arr.reduce((a, b) => (b[key] > a[key] ? b : a)) : null);
const minBy = (arr, key) => (arr.length ? arr.reduce((a, b) => (b[key] < a[key] ? b : a)) : null);

/**
 * GET /api/analytics?from=&to=&month=&year=&shift=
 * Combines daily_power_consumption records with the matching day's average
 * Inductor PF (pulled from daily_inductor_data) into one dataset for the
 * Analytics Dashboard — trend charts, summary cards, and always-on monthly/
 * yearly comparisons (comparison charts ignore the date/month/year filter so
 * they stay meaningful even when the trend charts are narrowed to one day).
 */
async function getAnalytics(req, res, next) {
  try {
    const { from, to, month, year, shift } = req.query;
    const dateQuery = buildDateQuery({ from, to, month, year });
    const powerQuery = { ...dateQuery };
    if (shift) powerQuery.shift = shift;

    const filtered = await DailyPowerConsumption.find(powerQuery).sort({ date: 1 });

    const dates = filtered.map((r) => r.date);
    const inductorDocs = dates.length ? await DailyInductorData.find({ date: { $in: dates } }) : [];
    const pfByDate = {};
    inductorDocs.forEach((doc) => { pfByDate[doc.date] = avgInductorPF(doc); });

    const records = filtered.map((r) => ({
      date: r.date,
      shift: r.shift,
      mainPotPower: r.mainPotPower,
      pmPotPower: r.pmPotPower,
      overallPower: r.overallPower,
      metalCharging: r.metalCharging,
      drossGeneration: r.drossGeneration,
      powerPerTon: r.powerPerTon,
      drossPercent: r.drossPercent,
      avgPF: pfByDate[r.date] ?? null,
    }));

    const withProd = records.filter((r) => r.metalCharging);
    const withPower = records.filter((r) => r.overallPower);
    const withDross = records.filter((r) => r.drossGeneration);
    const withPF = records.filter((r) => r.avgPF);

    const summary = {
      avgProduction: avg(withProd, "metalCharging"),
      avgPower: avg(withPower, "overallPower"),
      avgDross: avg(withDross, "drossGeneration"),
      avgPF: avg(withPF, "avgPF"),
      highestProduction: maxBy(withProd, "metalCharging"),
      lowestProduction: minBy(withProd, "metalCharging"),
      highestPower: maxBy(withPower, "overallPower"),
      lowestPower: minBy(withPower, "overallPower"),
    };

    // Monthly/Yearly comparison: full history (shift filter still applies),
    // independent of the from/to/month/year narrowing above.
    const allQuery = shift ? { shift } : {};
    const all = await DailyPowerConsumption.find(allQuery).sort({ date: 1 });
    const monthlyMap = {};
    const yearlyMap = {};
    all.forEach((r) => {
      const m = r.date.slice(0, 7);
      const y = r.date.slice(0, 4);
      if (!monthlyMap[m]) monthlyMap[m] = { month: m, power: 0, production: 0 };
      monthlyMap[m].power += r.overallPower;
      monthlyMap[m].production += r.metalCharging;
      if (!yearlyMap[y]) yearlyMap[y] = { year: y, power: 0, production: 0 };
      yearlyMap[y].power += r.overallPower;
      yearlyMap[y].production += r.metalCharging;
    });

    res.json({
      records,
      summary,
      monthlyComparison: Object.values(monthlyMap),
      yearlyComparison: Object.values(yearlyMap),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalytics };
