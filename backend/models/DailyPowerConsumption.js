// backend/controllers/powerController.js
const DailyPowerConsumption = require("../models/DailyPowerConsumption");

// Helper function to calculate derived values accurately (matches pre-save logic)
const calculatePowerMetrics = (data) => {
  const mainPotPower = Number(data.mainPotPower) || 0;
  const pmPotPower = Number(data.pmPotPower) || 0;
  const metalCharging = Number(data.metalCharging) || 0;
  const drossGeneration = Number(data.drossGeneration) || 0;

  const overallPower = mainPotPower + pmPotPower;
  const powerPerTon = metalCharging > 0 ? overallPower / metalCharging : 0;
  const drossPercent = metalCharging > 0 ? (drossGeneration / (metalCharging * 1000)) * 100 : 0; // standard calculation

  return {
    ...data,
    mainPotPower,
    pmPotPower,
    overallPower,
    metalCharging,
    drossGeneration,
    powerPerTon,
    drossPercent,
  };
};

// 1. CREATE / UPDATE POWER DATA (UPSERT)
exports.createPower = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const calculatedData = calculatePowerMetrics(req.body);

    const payload = {
      ...calculatedData,
      createdByName: req.user?.username || req.body.createdByName || "Admin User",
      createdBy: req.user?._id || undefined,
      lastUpdated: new Date(),
    };

    const record = await DailyPowerConsumption.findOneAndUpdate(
      { date },
      { $set: payload },
      { new: true, upsert: true, runValidators: false }
    );

    return res.status(201).json({
      message: "Power data saved successfully",
      data: record,
    });
  } catch (err) {
    console.error("Error in createPower:", err);
    res.status(500).json({ message: "Failed to save power data", error: err.message });
  }
};

// 2. GET POWER DATA BY DATE
exports.getPowerByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const record = await DailyPowerConsumption.findOne({ date });

    if (!record) {
      return res.status(404).json({ message: `No power data found for ${date}` });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 3. LIST ALL POWER ENTRIES
exports.listPower = async (req, res) => {
  try {
    const records = await DailyPowerConsumption.find().sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 4. UPDATE POWER DATA
exports.updatePower = async (req, res) => {
  try {
    const { date } = req.params;
    const calculatedData = calculatePowerMetrics(req.body);

    const record = await DailyPowerConsumption.findOneAndUpdate(
      { date },
      { $set: { ...calculatedData, lastUpdated: new Date() } },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: "Record not found to update" });
    }

    res.json({ message: "Updated successfully", data: record });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

// 5. DELETE POWER DATA
exports.deletePower = async (req, res) => {
  try {
    const { date } = req.params;
    await DailyPowerConsumption.findOneAndDelete({ date });
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

// 6. MONTHLY ANALYSIS
exports.getMonthlyAnalysis = async (req, res) => {
  try {
    const records = await DailyPowerConsumption.find().sort({ date: 1 });
    res.json({ count: records.length, records });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 7. YEARLY ANALYSIS
exports.getYearlyAnalysis = async (req, res) => {
  try {
    const records = await DailyPowerConsumption.find().sort({ date: 1 });
    res.json({ count: records.length, records });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};