const express = require("express");
const router = express.Router();
const InductorRemark = require("../models/InductorRemark");

// 1. Get all remarks for a specific inductor
router.get("/remarks/:inductorKey", async (req, res) => {
  try {
    const { inductorKey } = req.params;
    const remarks = await InductorRemark.find({ inductorKey }).sort({ createdAt: -1 });
    res.json({ success: true, data: remarks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Save new remark for an inductor
router.post("/remarks", async (req, res) => {
  try {
    const { inductorKey, inductorName, remark, category, createdBy } = req.body;
    if (!inductorKey || !remark) {
      return res.status(400).json({ success: false, message: "Key and Remark are required" });
    }

    const newRemark = new InductorRemark({
      inductorKey,
      inductorName,
      remark,
      category: category || "General",
      createdBy: createdBy || "Site Admin",
    });

    await newRemark.save();
    res.json({ success: true, data: newRemark, message: "Remark saved successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;