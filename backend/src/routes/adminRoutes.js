const router = require("express").Router();
const PDFDocument = require("pdfkit");

const Borrow = require("../models/Borrow");
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
}

// JSON logs
router.get("/logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const records = await Borrow.find()
      .populate("userId", "name email")
      .populate("utensilId", "name")
      .sort({ createdAt: -1 });

    const logs = records.map((r) => ({
      _id: r._id,
      qty: r.qty,
      status: r.status,
      borrowedAt: r.borrowedAt,
      returnedAt: r.returnedAt,
      user: {
        _id: r.userId?._id,
        name: r.userId?.name || "Unknown",
        email: r.userId?.email || "Unknown"
      },
      utensil: {
        _id: r.utensilId?._id,
        name: r.utensilId?.name || "Unknown"
      }
    }));

    return res.json({ ok: true, logs });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// User management
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.json({ ok: true, users });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

router.patch("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, role } = req.body || {};
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ ok: false, message: "Name cannot be empty." });
      }
      user.name = trimmedName;
    }

    if (typeof role === "string") {
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ ok: false, message: "Invalid role." });
      }

      if (String(req.params.id) === String(req.user.id) && role !== user.role) {
        return res.status(400).json({ ok: false, message: "You cannot change your own admin role." });
      }

      user.role = role;
    }

    await user.save();

    return res.json({
      ok: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ ok: false, message: "You cannot delete your own admin account." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }

    await user.deleteOne();
    return res.json({ ok: true, message: "User deleted." });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// PDF download
router.get("/logs/pdf", requireAuth, requireAdmin, async (req, res) => {
  try {
    const records = await Borrow.find()
      .populate("userId", "name email")
      .populate("utensilId", "name")
      .sort({ createdAt: -1 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="utensil-logs.pdf"');

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    // Title
    doc.fontSize(18).text("Utensil Borrow/Return Logs", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("gray").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1);
    doc.fillColor("black");

    // Table header
    const startX = 40;
    let y = doc.y;

    const cols = [
      { label: "User", w: 70 },
      { label: "Email", w: 112 },
      { label: "Utensil", w: 60 },
      { label: "Qty", w: 35 },
      { label: "Status", w: 52 },
      { label: "Borrowed Time", w: 96 },
      { label: "Returned Time", w: 96 }
    ];

    const tableRight = startX + cols.reduce((sum, col) => sum + col.w, 0);

    const drawHeader = (headerY) => {
      doc.fontSize(9).font("Helvetica-Bold");
      let headerX = startX;
      cols.forEach((c) => {
        doc.text(c.label, headerX, headerY, { width: c.w });
        headerX += c.w;
      });

      const dividerY = headerY + 16;
      doc.moveTo(startX, dividerY).lineTo(tableRight, dividerY).stroke();
      return dividerY + 8;
    };

    y = drawHeader(y);

    // Rows
    doc.font("Helvetica").fontSize(9);

    for (const r of records) {
      const userName = r.userId?.name || "Unknown";
      const userEmail = r.userId?.email || "Unknown";
      const utensilName = r.utensilId?.name || "Unknown";
      const qty = String(r.qty || 0);
      const status = r.status || "unknown";
      const borrowedAt = formatDateTime(r.borrowedAt);
      const returnedAt = formatDateTime(r.returnedAt);
      const rowValues = [
        userName,
        userEmail,
        utensilName,
        qty,
        status,
        borrowedAt,
        returnedAt
      ];
      const rowHeight = rowValues.reduce((maxHeight, value, index) => {
        const cellHeight = doc.heightOfString(value, { width: cols[index].w });
        return Math.max(maxHeight, cellHeight);
      }, 0) + 8;

      // new page if near bottom
      if (y + rowHeight > 760) {
        doc.addPage();
        y = drawHeader(60);
      }

      let x = startX;
      rowValues.forEach((value, index) => {
        doc.text(value, x, y, { width: cols[index].w });
        x += cols[index].w;
      });

      y += rowHeight;
    }

    doc.end();
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
