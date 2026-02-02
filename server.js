require("dotenv").config();
const express = require("express");
const connectDB = require("./db");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  if (
    ["PUT", "PATCH", "POST"].includes(req.method) &&
    !req.headers["content-length"]
  ) {
    req.body = {};
  }
  next();
});

// Auth middleware
const auth = require("./middleware/auth");

// Routes
const authRoutes = require("./routes/auth");
const groupRoutes = require("./routes/groups");
const expenseRoutes = require("./routes/expenses");
const summaryRoutes = require("./routes/summary");
// Protected routes (need auth token)

// Public routes (no auth needed)
app.use("/api/auth", authRoutes);

// Protected routes (need auth token)
const settlementRoutes = require("./routes/settlements");

app.use("/api/settlements", auth, settlementRoutes);
app.use("/api/groups", auth, groupRoutes);
app.use("/api/expenses", auth, expenseRoutes);
app.use("/api/summary", auth, summaryRoutes);

// Start
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
});

module.exports = app;
