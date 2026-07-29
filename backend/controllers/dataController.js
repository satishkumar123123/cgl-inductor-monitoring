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

// 2. CREATE / SAVE DASHBOARD DATA (FIXED: Added all fields including dross)
exports.createData = async (req, res) => {
  try {
    const { 
      date, 
      source, 
      uploadedFileName, 
      mainPot, 
      pmPot, 
      productionAndDross, 
      bottomDrossReport, 
      remarks, 
      status 
    } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date required hai!" });
    }

    const payload = {
      date,
      source: source || "manual",
      uploadedFileName: uploadedFileName || "",
      createdByName: req.user?.username || req.user?.name || req.body.createdByName || "Admin User",
      createdBy: req.user?._id || undefined,
      mainPot: mainPot || {},
      pmPot: pmPot || {},
      productionAndDross: productionAndDross || {},
      bottomDrossReport: bottomDrossReport || {},
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

// 3. GET DATA BY DATE
exports.getDataByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const record = await DailyInductorData.findOne({ date });

    if (!record) {
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

// 4. UPDATE DATA
exports.updateData = async (req, res) => {
  try {
    const { date } = req.params;
    
    const record = await DailyInductorData.findOneAndUpdate(
      { date },
      { $set: { ...req.body, lastUpdated: new Date() } },
      { new: true, upsert: true }
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