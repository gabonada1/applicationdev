const router = require("express").Router();
const PDFDocument = require("pdfkit");

const Borrow = require("../models/Borrow");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

// ✅ JSON logs
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

// ✅ PDF download
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
      { label: "User", w: 150 },
      { label: "Email", w: 170 },
      { label: "Utensil", w: 110 },
      { label: "Qty", w: 35 },
      { label: "Status", w: 60 }
    ];

    doc.fontSize(10).font("Helvetica-Bold");
    let x = startX;
    cols.forEach((c) => {
      doc.text(c.label, x, y, { width: c.w });
      x += c.w;
    });

    y += 16;
    doc.moveTo(startX, y).lineTo(555, y).stroke();
    y += 8;

    // Rows
    doc.font("Helvetica").fontSize(9);

    for (const r of records) {
      const userName = r.userId?.name || "Unknown";
      const userEmail = r.userId?.email || "Unknown";
      const utensilName = r.utensilId?.name || "Unknown";
      const qty = String(r.qty || 0);
      const status = r.status || "unknown";

      // new page if near bottom
      if (y > 760) {
        doc.addPage();
        y = 60;
      }

      x = startX;
      doc.text(userName, x, y, { width: cols[0].w }); x += cols[0].w;
      doc.text(userEmail, x, y, { width: cols[1].w }); x += cols[1].w;
      doc.text(utensilName, x, y, { width: cols[2].w }); x += cols[2].w;
      doc.text(qty, x, y, { width: cols[3].w }); x += cols[3].w;
      doc.text(status, x, y, { width: cols[4].w });

      y += 16;
    }

    doc.end();
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
