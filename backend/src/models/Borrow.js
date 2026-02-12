const mongoose = require("mongoose");

const BorrowSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    utensilId: { type: mongoose.Schema.Types.ObjectId, ref: "Utensil", required: true },

    qty: { type: Number, required: true, min: 1 },

    status: { type: String, enum: ["borrowed", "returned"], default: "borrowed" },
    borrowedAt: { type: Date, default: Date.now },
    returnedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Borrow", BorrowSchema);
