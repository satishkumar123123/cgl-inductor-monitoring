// backend/controllers/dataController.js
const DailyInductorData = require("../models/DailyInductorData");

// 1. GET ALL DATA (History Page List)
exports.getAllData = async (req, res) => {
  try {
    const records = await DailyInductorData.find().sort({ date: -1 });
    console.log(`[HISTORY SUCCESS] Total records found: ${records.length}`);
    return res.status(200).json(records);
  } catch (err) {
    console.error("[HISTORY ERROR]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 2. CREATE / SAVE DASHBOARD DATA
exports.createData = async (req, res) => {
  try {
    const { date, source, uploadedFileName, mainPot, pmPot, remarks, status } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date required hai!" });
    }

    const payload = {
      date,
      source: source || "manual",
      uploadedFileName: uploadedFileName || "",
      createdByName: req.user?.username || req.body.createdByName || "Admin User",
      createdBy: req.user?._id || undefined,
      mainPot: mainPot || {},
      pmPot: pmPot || {},
      remarks: remarks || "",
      status: status || "Normal",
      lastUpdated: new Date(),
    };

    // findOneAndUpdate with upsert:true guarantees save/insert in MongoDB
    const updatedRecord = await DailyInductorData.findOneAndUpdate(
      { date },
      { $set: payload },
      { new: true, upsert: true, runValidators: false }
    );

    console.log(`[SAVE SUCCESS] Data saved for date: ${date}`);
    return res.status(201).json({
      message: "Data successfully save ho gaya hai!",
      data: updatedRecord,
    });
  } catch (err) {
    console.error("[SAVE ERROR]", err);
    return res.status(500).json({ message: "Data save karne me error aaya", error: err.message });
  }
};

// 3. GET DATA BY DATE (FIXED: Returns 404 if date does not exist in DB)
exports.getDataByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const record = await DailyInductorData.findOne({ date });

    if (!record) {
      // Return 404 so frontend knows this date is NOT on server yet
      return res.status(404).json({
        message: "No record found for this date",
        date,
      });
    }

    return res.status(200).json(record);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 4. UPDATE DATA (FIXED: Supports Upsert fallback)
exports.updateData = async (req, res) => {
  try {
    const { date } = req.params;
    
    const record = await DailyInductorData.findOneAndUpdate(
      { date },
      { $set: { ...req.body, lastUpdated: new Date() } },
      { new: true, upsert: true } // upsert: true ensures document is created if missing
    );

    return res.status(200).json({ message: "Updated successfully", data: record });
  } catch (err) {
    return res.status(500).json({ message: "Update fail ho gaya", error: err.message });
  }
};

// 5. DELETE DATA
exports.deleteData = async (req, res) => {
  try {
    const { date } = req.params;
    await DailyInductorData.findOneAndDelete({ date });
    return res.status(200).json({ message: "Record delete ho gaya" });
  } catch (err) {
    return res.status(500).json({ message: "Delete fail ho gaya", error: err.message });
  }
};