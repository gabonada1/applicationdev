const mongoose = require("mongoose");

const UtensilSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Available", "Low Stock", "Out of Stock"], default: "Available" },

    // Image stored directly in MongoDB
    image: {
      data: Buffer,
      contentType: String
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Utensil", UtensilSchema);
