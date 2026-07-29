// backend/routes/dataRoutes.js
const express = require("express");
const router = express.Router();
const {
  createData,
  getDataByDate,
  getAllData,
  updateData,
  deleteData,
} = require("../controllers/dataController");

// 1. GET /api/data -> History section ke liye saare dates ka data fetch karega
router.get("/", getAllData);

// 2. POST /api/data -> Dashboard se Inductor values save/upsert karega
router.post("/", createData);

// 3. GET /api/data/:date -> Specific date ka data fetch karega
router.get("/:date", getDataByDate);

// 4. PUT /api/data/:date -> Date-wise record update karega
router.put("/:date", updateData);

// 5. DELETE /api/data/:date -> Date-wise record delete karega
router.delete("/:date", deleteData);

module.exports = router;