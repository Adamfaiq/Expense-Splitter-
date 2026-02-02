const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const ExpenseItem = require("../models/ExpenseItem");
const Settlement = require("../models/Settlement");

// POST - Create Expense with Items
router.post("/", async (req, res) => {
  try {
    const { groupId, paidBy, description, items } = req.body;

    if (!groupId || !paidBy || !items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    const expense = await Expense.create({
      groupId,
      paidBy,
      totalAmount,
      description,
    });

    const expenseItems = await ExpenseItem.insertMany(
      items.map((item) => ({
        expenseId: expense._id,
        itemName: item.itemName,
        price: item.price,
        type: item.type,
        participants: item.participants,
      })),
    );

    res.status(201).json({
      success: true,
      expense,
      items: expenseItems,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET - Get all expenses by group
router.get("/group/:groupId", async (req, res) => {
  try {
    const expenses = await Expense.find({ groupId: req.params.groupId })
      .populate("paidBy", "username")
      .sort({ date: -1 });

    // Get items for each expense
    const expensesWithItems = await Promise.all(
      expenses.map(async (expense) => {
        const items = await ExpenseItem.find({
          expenseId: expense._id,
        }).populate("participants", "username");
        return { ...expense._doc, items };
      }),
    );

    res.json({ success: true, expenses: expensesWithItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT - Edit expense
router.put("/:id", async (req, res) => {
  try {
    const { description, items } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    // Update description
    if (description) {
      expense.description = description;
    }

    // Update items if provided
    if (items && items.length > 0) {
      // Delete old items
      await ExpenseItem.deleteMany({ expenseId: expense._id });

      // Recalculate total
      expense.totalAmount = items.reduce((sum, item) => sum + item.price, 0);

      // Create new items
      await ExpenseItem.insertMany(
        items.map((item) => ({
          expenseId: expense._id,
          itemName: item.itemName,
          price: item.price,
          type: item.type,
          participants: item.participants,
        })),
      );
    }

    await expense.save();

    // Fetch updated expense with items
    const updatedItems = await ExpenseItem.find({
      expenseId: expense._id,
    }).populate("participants", "username");

    res.json({
      success: true,
      message: "Expense updated",
      expense,
      items: updatedItems,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE - Delete expense and its items
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    // Delete related items
    await ExpenseItem.deleteMany({ expenseId: expense._id });

    // Delete related settlements
    await Settlement.deleteMany({ groupId: expense.groupId });

    // Delete expense
    await Expense.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
