const express = require("express");
const router = express.Router();
const Settlement = require("../models/Settlement");

// POST - Create settlement record
router.post("/", async (req, res) => {
  try {
    const { groupId, from, to, amount } = req.body;

    const settlement = await Settlement.create({
      groupId,
      from,
      to,
      amount,
      status: "pending",
    });

    res.status(201).json({ success: true, settlement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT - Mark settlement as paid
router.put("/:id/pay", async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);

    if (!settlement) {
      return res
        .status(404)
        .json({ success: false, message: "Settlement not found" });
    }

    if (settlement.status === "paid") {
      return res.status(400).json({ success: false, message: "Already paid" });
    }

    settlement.status = "paid";
    settlement.paidAt = new Date();
    await settlement.save();

    res.json({
      success: true,
      message: "Settlement marked as paid",
      settlement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET - Get all settlements by group
router.get("/group/:groupId", async (req, res) => {
  try {
    const settlements = await Settlement.find({ groupId: req.params.groupId })
      .populate("from", "username")
      .populate("to", "username")
      .sort({ createdAt: -1 });

    res.json({ success: true, settlements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
