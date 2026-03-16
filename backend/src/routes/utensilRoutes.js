const router = require("express").Router();
const multer = require("multer");
const Utensil = require("../models/Utensil");
const Borrow = require("../models/Borrow");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// LIST utensils
router.get("/", async (req, res) => {
  try {
    const items = await Utensil.find()
      .select("name qty status image.contentType createdAt updatedAt")
      .sort({ createdAt: -1 });

    const mapped = items.map((u) => ({
      _id: u._id,
      name: u.name,
      qty: u.qty,
      status: u.status,
      hasImage: !!u.image?.contentType,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));

    return res.json({ ok: true, items: mapped });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

//  STREAM image
router.get("/:id/image", async (req, res) => {
  try {
    const item = await Utensil.findById(req.params.id).select("image");
    if (!item?.image?.data) return res.status(404).send("No image");
    res.set("Content-Type", item.image.contentType || "image/jpeg");
    return res.send(item.image.data);
  } catch {
    return res.status(500).send("Error");
  }
});

// ADMIN create utensil
router.post("/", requireAuth, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, qty, status } = req.body;
    if (!name || qty === undefined) {
      return res.status(400).json({ ok: false, message: "Name and qty are required." });
    }

    const doc = {
      name: String(name).trim(),
      qty: Number(qty),
      status: status || "Available",
      createdBy: req.user.id
    };

    if (req.file) {
      doc.image = { data: req.file.buffer, contentType: req.file.mimetype };
    }

    const item = await Utensil.create(doc);
    return res.json({
      ok: true,
      item: { _id: item._id, name: item.name, qty: item.qty, status: item.status, hasImage: !!item.image?.contentType }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// USER borrow utensil
router.post("/:id/borrow", requireAuth, async (req, res) => {
  try {
    const utensilId = req.params.id;
    const qty = Math.max(1, Number(req.body.qty || 1));

    const utensil = await Utensil.findById(utensilId);
    if (!utensil) return res.status(404).json({ ok: false, message: "Utensil not found." });

    if (utensil.qty < qty) {
      return res.status(400).json({ ok: false, message: "Not enough stock." });
    }

    // decrease stock
    utensil.qty -= qty;

    // auto status update
    if (utensil.qty <= 0) utensil.status = "Out of Stock";
    else if (utensil.qty <= 10) utensil.status = "Low Stock";
    else utensil.status = "Available";

    await utensil.save();

    const borrow = await Borrow.create({
      userId: req.user.id,
      utensilId: utensil._id,
      qty
    });

    return res.json({ ok: true, message: "Borrowed successfully.", borrowId: borrow._id });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// USER return utensil (by borrow record id)
router.post("/:id/return", requireAuth, async (req, res) => {
  try {
    const borrowId = req.body.borrowId;
    if (!borrowId) return res.status(400).json({ ok: false, message: "borrowId is required." });

    const borrow = await Borrow.findById(borrowId);
    if (!borrow) return res.status(404).json({ ok: false, message: "Borrow record not found." });

    // must be same user + not yet returned
    if (String(borrow.userId) !== String(req.user.id)) {
      return res.status(403).json({ ok: false, message: "Not allowed." });
    }
    if (borrow.status === "returned") {
      return res.status(400).json({ ok: false, message: "Already returned." });
    }

    const utensil = await Utensil.findById(borrow.utensilId);
    if (!utensil) return res.status(404).json({ ok: false, message: "Utensil not found." });

    // increase stock
    utensil.qty += borrow.qty;

    // auto status update
    if (utensil.qty <= 0) utensil.status = "Out of Stock";
    else if (utensil.qty <= 10) utensil.status = "Low Stock";
    else utensil.status = "Available";

    await utensil.save();

    borrow.status = "returned";
    borrow.returnedAt = new Date();
    await borrow.save();

    return res.json({ ok: true, message: "Returned successfully." });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ADMIN update utensil (edit) with optional new image
router.put("/:id", requireAuth, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, qty, status } = req.body;

    const utensil = await Utensil.findById(req.params.id);
    if (!utensil) return res.status(404).json({ ok: false, message: "Utensil not found." });

    if (name !== undefined) utensil.name = String(name).trim();
    if (qty !== undefined) utensil.qty = Number(qty);
    if (status !== undefined) utensil.status = status;

    // replace image only if admin picked a new one
    if (req.file) {
      utensil.image = { data: req.file.buffer, contentType: req.file.mimetype };
    }

    await utensil.save();

    return res.json({
      ok: true,
      item: {
        _id: utensil._id,
        name: utensil.name,
        qty: utensil.qty,
        status: utensil.status,
        hasImage: !!utensil.image?.contentType
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
