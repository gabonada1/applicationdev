const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();
app.set("trust proxy", true);

// middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// health
app.get("/", (req, res) => res.json({ ok: true, message: "API running" }));

// routes (all inside /src/routes)
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/utensils", require("./src/routes/utensilRoutes"));

// keep your existing borrow routes
app.use("/api/borrows", require("./src/routes/borrowRoutes")); // existing endpoints
app.use("/api/borrows", require("./src/routes/borrows"));      // PDF endpoint (we'll add)

// admin
app.use("/api/admin", require("./src/routes/adminRoutes"));

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on ${process.env.PUBLIC_API_URL || `http://localhost:${PORT}`}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
