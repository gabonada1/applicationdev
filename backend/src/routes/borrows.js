const express = require("express");
const PDFDocument = require("pdfkit");
const auth = require("../middleware/auth");

const Borrow = require("../models/Borrow");
const Utensil = require("../models/Utensil"); // exists in your src/models

const router = express.Router();

router.get("/me/pdf", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });

    //  handle many possible user field names
    const query = {
      $or: [
        { user: userId },
        { userId: userId },
        { borrower: userId },
        { user: String(userId) },
        { userId: String(userId) },
        { borrower: String(userId) }
      ]
    };

    // Use lean() to avoid mongoose doc weirdness
    const records = await Borrow.find(query).sort({ createdAt: -1 }).lean();

    // Build utensil name map (works even if Borrow only stores utensil ObjectId)
    const utensilIds = records
      .map((r) => r.utensil?._id || r.utensil || r.utensilId || r.utensil_id)
      .filter(Boolean)
      .map(String);

    let utensilMap = {};
    if (utensilIds.length) {
      const utensils = await Utensil.find({ _id: { $in: utensilIds } })
        .select("name")
        .lean();

      utensilMap = utensils.reduce((acc, u) => {
        acc[String(u._id)] = u.name;
        return acc;
      }, {});
    }

    const getUtensilName = (r) => {
      // if already populated or embedded
      if (r.utensil && typeof r.utensil === "object" && r.utensil.name) return r.utensil.name;

      const id = r.utensil?._id || r.utensil || r.utensilId || r.utensil_id;
      if (id && utensilMap[String(id)]) return utensilMap[String(id)];

      return "Unknown";
    };

    // group
    const borrowed = records.filter((r) => String(r.status || "").toLowerCase() === "borrowed");
    const returned = records.filter((r) => String(r.status || "").toLowerCase() === "returned");

    // PDF headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="my-logs.pdf"');

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    // Title
    doc.fontSize(18).text("My Borrow Logs", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.fillColor("#000");
    doc.moveDown(1);

    if (!records.length) {
      doc.fontSize(12).text("No borrowed/returned records found for this account.", { align: "center" });
      doc.end();
      return;
    }

    const sectionHeader = (title) => {
      doc.moveDown(0.6);
      doc.fontSize(13).fillColor("#000").text(title);
      doc.moveDown(0.2);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);
    };

    const tableHeader = () => {
      const y = doc.y;
      doc.fontSize(11).fillColor("#000");
      doc.text("Utensil", 40, y, { width: 215 });
      doc.text("Qty", 265, y, { width: 40 });
      doc.text("Borrowed At", 310, y, { width: 120 });
      doc.text("Returned At", 435, y, { width: 120 });
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);
    };

    const row = (r) => {
      const utensilName = getUtensilName(r);
      const qty = r.qty ?? 1;
      const borrowedAt = r.borrowedAt ? new Date(r.borrowedAt).toLocaleString() : "—";
      const returnedAt = r.returnedAt ? new Date(r.returnedAt).toLocaleString() : "—";

      const y = doc.y;
      doc.fontSize(10).fillColor("#000");
      doc.text(utensilName, 40, y, { width: 215 });
      doc.text(String(qty), 265, y, { width: 40 });
      doc.text(borrowedAt, 310, y, { width: 120 });
      doc.text(returnedAt, 435, y, { width: 120 });

      doc.moveDown(0.85);
      if (doc.y > 760) doc.addPage();
    };

    // Borrowed section
    sectionHeader(`Borrowed (${borrowed.length})`);
    if (borrowed.length) {
      tableHeader();
      borrowed.forEach(row);
    } else {
      doc.fontSize(11).fillColor("#666").text("No borrowed items.");
      doc.fillColor("#000");
    }

    // Returned section
    sectionHeader(`Returned (${returned.length})`);
    if (returned.length) {
      tableHeader();
      returned.forEach(row);
    } else {
      doc.fontSize(11).fillColor("#666").text("No returned items.");
      doc.fillColor("#000");
    }

    // Footer
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#666").text(`Total records: ${records.length}`, { align: "right" });

    doc.end();
  } catch (err) {
    console.error("❌ /api/borrows/me/pdf error:", err?.stack || err);
    // if headers not sent, reply JSON; if headers sent, just end
    if (!res.headersSent) {
      res.status(500).json({ ok: false, message: "Failed to generate PDF" });
    } else {
      try { res.end(); } catch {}
    }
  }
});

module.exports = router;
