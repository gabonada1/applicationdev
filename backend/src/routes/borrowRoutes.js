const router = require("express").Router();
const Borrow = require("../models/Borrow");
const { requireAuth } = require("../middleware/authMiddleware");

//  Get my borrowed + returned history
router.get("/me", requireAuth, async (req, res) => {
  try {
    const records = await Borrow.find({ userId: req.user.id })
      .populate("utensilId", "name")
      .sort({ createdAt: -1 });

    const mapped = records.map((r) => ({
      _id: r._id,
      qty: r.qty,
      status: r.status,
      borrowedAt: r.borrowedAt,
      returnedAt: r.returnedAt,
      utensil: {
        _id: r.utensilId?._id,
        name: r.utensilId?.name || "Unknown"
      }
    }));

    return res.json({ ok: true, records: mapped });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
