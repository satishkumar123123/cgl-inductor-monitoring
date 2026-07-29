const DailyPowerConsumption = require("../models/DailyPowerConsumption");

function withDerived(body) {
  const mainPotPower = Number(body.mainPotPower) || 0;
  const pmPotPower = Number(body.pmPotPower) || 0;
  const metalCharging = Number(body.metalCharging) || 0;
  const drossGeneration = Number(body.drossGeneration) || 0;
  const overallPower = mainPotPower + pmPotPower;
  return {
    ...body,
    mainPotPower, pmPotPower, metalCharging, drossGeneration, overallPower,
    powerPerTon: metalCharging > 0 ? overallPower / metalCharging : 0,
    drossPercent: metalCharging > 0 ? (drossGeneration / metalCharging) * 100 : 0,
  };
}

/** POST /api/power — create a new day's power/production record. */
async function createPower(req, res, next) {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ message: "date is required" });
    const existing = await DailyPowerConsumption.findOne({ date });
    if (existing) return res.status(409).json({ message: "Record already exists for this date, use PUT to update" });

    const record = await DailyPowerConsumption.create({
      ...withDerived(req.body),
      createdBy: req.user?.id,
      createdByName: req.user?.name || req.user?.username || "",
      lastUpdated: new Date(),
    });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
}

/** GET /api/power/:date */
async function getPowerByDate(req, res, next) {
  try {
    const record = await DailyPowerConsumption.findOne({ date: req.params.date });
    if (!record) return res.status(404).json({ message: "No record for this date" });
    res.json(record);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/power/:date — upsert. */
async function updatePower(req, res, next) {
  try {
    const update = {
      ...withDerived(req.body),
      date: req.params.date,
      lastUpdated: new Date(),
    };
    if (req.user) {
      update.createdBy = update.createdBy || req.user.id;
      update.createdByName = update.createdByName || req.user.name || req.user.username;
    }
    const record = await DailyPowerConsumption.findOneAndUpdate(
      { date: req.params.date },
      update,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(record);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/power/:date — Admin only. */
async function deletePower(req, res, next) {
  try {
    const result = await DailyPowerConsumption.findOneAndDelete({ date: req.params.date });
    if (!result) return res.status(404).json({ message: "No record for this date" });
    res.json({ message: "Deleted", date: req.params.date });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/power?from=&to=&month=&year=&shift=
 * Flexible listing used to feed the trend charts on the Power Consumption page.
 */
async function listPower(req, res, next) {
  try {
    const { from, to, month, year, shift } = req.query;
    const query = {};
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    if (year && month) {
      const mm = String(month).padStart(2, "0");
      query.date = { $gte: `${year}-${mm}-01`, $lte: `${year}-${mm}-31` };
    } else if (year) {
      query.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
    }
    if (shift) query.shift = shift;

    const records = await DailyPowerConsumption.find(query).sort({ date: 1 });
    res.json(records);
  } catch (err) {
    next(err);
  }
}

/** GET /api/power/monthly?year=&month= — Module 4 */
async function getMonthlyAnalysis(req, res, next) {
  try {
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ message: "year and month are required" });
    const mm = String(month).padStart(2, "0");
    const records = await DailyPowerConsumption.find({ date: { $gte: `${year}-${mm}-01`, $lte: `${year}-${mm}-31` } }).sort({ date: 1 });

    if (!records.length) return res.json({ year, month, records: [], summary: null });

    const totalPower = records.reduce((a, r) => a + r.overallPower, 0);
    const totalProduction = records.reduce((a, r) => a + r.metalCharging, 0);
    const totalDross = records.reduce((a, r) => a + r.drossGeneration, 0);

    // Efficiency (power per ton produced) — best = lowest, worst = highest.
    const bestEfficiency = records.reduce((a, b) => (b.powerPerTon < a.powerPerTon ? b : a));
    const worstEfficiency = records.reduce((a, b) => (b.powerPerTon > a.powerPerTon ? b : a));
    // Consumption (raw overall power) — highest vs lowest day, independent of production.
    const highestConsumption = records.reduce((a, b) => (b.overallPower > a.overallPower ? b : a));
    const lowestConsumption = records.reduce((a, b) => (b.overallPower < a.overallPower ? b : a));

    const summary = {
      totalPower,
      totalProduction,
      totalDross,
      avgPower: totalPower / records.length,
      avgProduction: totalProduction / records.length,
      avgDross: totalDross / records.length,
      powerPerTon: totalProduction > 0 ? totalPower / totalProduction : 0,
      drossPercent: totalProduction > 0 ? (totalDross / totalProduction) * 100 : 0,
      bestEfficiencyDay: { date: bestEfficiency.date, powerPerTon: bestEfficiency.powerPerTon },
      worstEfficiencyDay: { date: worstEfficiency.date, powerPerTon: worstEfficiency.powerPerTon },
      highestConsumptionDay: { date: highestConsumption.date, overallPower: highestConsumption.overallPower },
      lowestConsumptionDay: { date: lowestConsumption.date, overallPower: lowestConsumption.overallPower },
    };

    res.json({ year, month, records, summary });
  } catch (err) {
    next(err);
  }
}

/** GET /api/power/yearly?year= — Module 5 */
async function getYearlyAnalysis(req, res, next) {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ message: "year is required" });
    const records = await DailyPowerConsumption.find({ date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } }).sort({ date: 1 });

    if (!records.length) return res.json({ year, monthly: [], summary: null });

    const monthlyMap = {};
    records.forEach((r) => {
      const m = r.date.slice(0, 7); // YYYY-MM
      if (!monthlyMap[m]) monthlyMap[m] = { month: m, power: 0, production: 0, dross: 0, count: 0 };
      monthlyMap[m].power += r.overallPower;
      monthlyMap[m].production += r.metalCharging;
      monthlyMap[m].dross += r.drossGeneration;
      monthlyMap[m].count += 1;
    });
    const monthly = Object.values(monthlyMap).map((m) => ({
      month: m.month,
      totalPower: m.power,
      totalProduction: m.production,
      totalDross: m.dross,
      powerPerTon: m.production > 0 ? m.power / m.production : 0,
      drossPercent: m.production > 0 ? (m.dross / m.production) * 100 : 0,
    }));

    const totalPower = records.reduce((a, r) => a + r.overallPower, 0);
    const totalProduction = records.reduce((a, r) => a + r.metalCharging, 0);
    const totalDross = records.reduce((a, r) => a + r.drossGeneration, 0);

    // Day-level efficiency and consumption extremes across the whole year.
    const bestEfficiency = records.reduce((a, b) => (b.powerPerTon < a.powerPerTon ? b : a));
    const worstEfficiency = records.reduce((a, b) => (b.powerPerTon > a.powerPerTon ? b : a));
    const highestConsumption = records.reduce((a, b) => (b.overallPower > a.overallPower ? b : a));
    const lowestConsumption = records.reduce((a, b) => (b.overallPower < a.overallPower ? b : a));

    const summary = {
      totalPower, totalProduction, totalDross,
      avgPower: totalPower / records.length,
      avgProduction: totalProduction / records.length,
      avgDross: totalDross / records.length,
      powerPerTon: totalProduction > 0 ? totalPower / totalProduction : 0,
      drossPercent: totalProduction > 0 ? (totalDross / totalProduction) * 100 : 0,
      bestEfficiencyDay: { date: bestEfficiency.date, powerPerTon: bestEfficiency.powerPerTon },
      worstEfficiencyDay: { date: worstEfficiency.date, powerPerTon: worstEfficiency.powerPerTon },
      highestConsumptionDay: { date: highestConsumption.date, overallPower: highestConsumption.overallPower },
      lowestConsumptionDay: { date: lowestConsumption.date, overallPower: lowestConsumption.overallPower },
    };

    res.json({ year, monthly, summary });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPower, getPowerByDate, updatePower, deletePower, listPower, getMonthlyAnalysis, getYearlyAnalysis,
};
