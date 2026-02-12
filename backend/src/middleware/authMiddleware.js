const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, message: "Missing token." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // {id,email,role}
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Invalid token." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, message: "Unauthorized." });
  if (req.user.role !== "admin") return res.status(403).json({ ok: false, message: "Admin only." });
  next();
}

module.exports = { requireAuth, requireAdmin };
