const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const User = require("../models/User");

// POST - Create Group
router.post("/", async (req, res) => {
  try {
    const { groupName, members, createdBy } = req.body;

    // Verify all members exist
    const usersExist = await User.find({ _id: { $in: members } });
    if (usersExist.length !== members.length) {
      return res
        .status(400)
        .json({ success: false, message: "Some members not found" });
    }

    const group = await Group.create({
      groupName,
      members,
      createdBy,
    });

    res.status(201).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET - Get all groups
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("members", "username")
      .populate("createdBy", "username");

    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET - Get single group
router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("members", "username")
      .populate("createdBy", "username");

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
