require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Group = require("./models/Group");
const Expense = require("./models/Expense");
const ExpenseItem = require("./models/ExpenseItem");

const testDB = async () => {
  try {
    // Connect
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Group.deleteMany({});
    await Expense.deleteMany({});
    await ExpenseItem.deleteMany({});
    console.log("🗑️  Cleared old data");

    // 1. Create Users
    const ahmad = await User.create({
      username: "ahmad",
      email: "ahmad@test.com",
      password: "password123",
    });

    const amir = await User.create({
      username: "amir",
      email: "amir@test.com",
      password: "password123",
    });

    const farid = await User.create({
      username: "farid",
      email: "farid@test.com",
      password: "password123",
    });

    console.log(
      "👥 Created 3 users:",
      ahmad.username,
      amir.username,
      farid.username,
    );

    // 2. Create Group
    const group = await Group.create({
      groupName: "Geng Makan",
      members: [ahmad._id, amir._id, farid._id],
      createdBy: ahmad._id,
    });

    console.log("👨‍👩‍👦 Created group:", group.groupName);

    // 3. Create Expense
    const expense = await Expense.create({
      groupId: group._id,
      paidBy: ahmad._id,
      totalAmount: 30,
      description: "Dinner at restaurant",
      date: new Date(),
    });

    console.log(
      "💰 Created expense: RM",
      expense.totalAmount,
      "paid by",
      ahmad.username,
    );

    // 4. Create Expense Items
    const item1 = await ExpenseItem.create({
      expenseId: expense._id,
      itemName: "Nasi Goreng",
      price: 10,
      type: "personal",
      participants: [ahmad._id],
    });

    const item2 = await ExpenseItem.create({
      expenseId: expense._id,
      itemName: "Mee Goreng",
      price: 10,
      type: "personal",
      participants: [amir._id],
    });

    const item3 = await ExpenseItem.create({
      expenseId: expense._id,
      itemName: "Air Limau",
      price: 10,
      type: "shared",
      participants: [ahmad._id, amir._id, farid._id],
    });

    console.log(
      "🍜 Created 3 items:",
      item1.itemName,
      item2.itemName,
      item3.itemName,
    );

    // 5. Fetch & Display with Population
    console.log("\n📊 FETCHING DATA WITH RELATIONSHIPS:\n");

    const expenseWithItems = await Expense.findById(expense._id)
      .populate("paidBy", "username")
      .populate("groupId", "groupName");

    console.log("Expense:", {
      description: expenseWithItems.description,
      total: expenseWithItems.totalAmount,
      paidBy: expenseWithItems.paidBy.username,
      group: expenseWithItems.groupId.groupName,
    });

    const items = await ExpenseItem.find({ expenseId: expense._id }).populate(
      "participants",
      "username",
    );

    console.log("\nItems:");
    items.forEach((item) => {
      console.log(
        `- ${item.itemName} (RM${item.price}) [${item.type}] → ${item.participants.map((p) => p.username).join(", ")}`,
      );
    });

    // 6. Calculate who owes who
    console.log("\n💸 SETTLEMENT CALCULATION:\n");

    let ahmadConsume = 0;
    let amirConsume = 0;
    let faridConsume = 0;

    items.forEach((item) => {
      const splitAmount = item.price / item.participants.length;

      item.participants.forEach((participant) => {
        if (participant._id.equals(ahmad._id)) ahmadConsume += splitAmount;
        if (participant._id.equals(amir._id)) amirConsume += splitAmount;
        if (participant._id.equals(farid._id)) faridConsume += splitAmount;
      });
    });

    console.log("Ahmad consumed: RM", ahmadConsume.toFixed(2));
    console.log("Amir consumed: RM", amirConsume.toFixed(2));
    console.log("Farid consumed: RM", faridConsume.toFixed(2));

    const ahmadPaid = expense.totalAmount;
    const ahmadDeserve = ahmadPaid - ahmadConsume;

    console.log("\nAhmad paid: RM", ahmadPaid);
    console.log("Ahmad should get back: RM", ahmadDeserve.toFixed(2));

    console.log("\nSettlement:");
    console.log(`- Amir owes Ahmad: RM${amirConsume.toFixed(2)}`);
    console.log(`- Farid owes Ahmad: RM${faridConsume.toFixed(2)}`);

    console.log("\n✅ TEST COMPLETED!");

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    mongoose.connection.close();
  }
};

testDB();
