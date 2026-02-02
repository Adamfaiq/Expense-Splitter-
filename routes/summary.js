const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const ExpenseItem = require("../models/ExpenseItem");

// GET - Get settlement summary for a group
router.get("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    // Get all expenses in group
    const expenses = await Expense.find({ groupId }).populate(
      "paidBy",
      "username",
    );

    // Get all items for those expenses
    const expenseIds = expenses.map((e) => e._id);
    const items = await ExpenseItem.find({
      expenseId: { $in: expenseIds },
    }).populate("participants", "username");

    // Calculate per-person consumption
    const consumed = {}; // { userId: totalConsumed }

    // Track who paid what
    const paid = expenses.reduce((acc, expense) => {
      const payerId = expense.paidBy._id.toString();
      acc[payerId] = (acc[payerId] || 0) + expense.totalAmount;
      if (!consumed[payerId]) consumed[payerId] = 0;
      return acc;
    }, {});

    // Track what each person consumed
    // Track what each person consumed
    items.forEach((item) => {
      const splitAmount = item.price / item.participants.length;

      item.participants.forEach((participant) => {
        const userId = participant._id.toString();
        consumed[userId] = (consumed[userId] || 0) + splitAmount;
        if (!paid[userId]) paid[userId] = 0;
      });
    });

    // Calculate balance (positive = owes money, negative = should get money back)
    const balances = {};
    const allUserIds = new Set([
      ...Object.keys(consumed),
      ...Object.keys(paid),
    ]);

    allUserIds.forEach((userId) => {
      const totalPaid = paid[userId] || 0;
      const totalConsumed = consumed[userId] || 0;
      balances[userId] = {
        totalPaid: totalPaid,
        totalConsumed: parseFloat(totalConsumed.toFixed(2)),
        balance: parseFloat((totalConsumed - totalPaid).toFixed(2)),
        // positive = owes money
        // negative = should get money back
      };
    });

    // Build settlement (who owes who)
    const settlement = [];
    const debtors = []; // people who owe money (positive balance)
    const creditors = []; // people who should get money back (negative balance)

    Object.entries(balances).forEach(([userId, data]) => {
      if (data.balance > 0) debtors.push({ userId, amount: data.balance });
      if (data.balance < 0)
        creditors.push({ userId, amount: Math.abs(data.balance) });
    });

    // Match debtors with creditors
    debtors.forEach((debtor) => {
      creditors.forEach((creditor) => {
        if (debtor.amount > 0 && creditor.amount > 0) {
          const settleAmount = Math.min(debtor.amount, creditor.amount);
          settlement.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: parseFloat(settleAmount.toFixed(2)),
          });
          debtor.amount -= settleAmount;
          creditor.amount -= settleAmount;
        }
      });
    });

    // Populate user info in settlement
    const User = require("../models/User");
    const populatedSettlement = await Promise.all(
      settlement.map(async ({ from, to, amount }) => {
        const fromUser = await User.findById(from, "username");
        const toUser = await User.findById(to, "username");
        return {
          from: fromUser.username,
          to: toUser.username,
          amount,
        };
      }),
    );

    res.json({
      success: true,
      groupId,
      balances,
      settlement: populatedSettlement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
