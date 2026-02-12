const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const roleFromEmail = require("../utils/roleFromEmail");

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function make6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendResetCodeEmail(toEmail, code) {
  // If SMTP not configured, just log it (still works for testing)
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log("📩 Reset code (SMTP not set) =>", toEmail, code);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to: toEmail,
    subject: "Password Reset Code",
    text: `Your password reset code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, message: "Missing fields." });
    }

    const role = roleFromEmail(email);
    if (!role) {
      return res.status(400).json({
        ok: false,
        message: "Email must end with @gmail.com (student) or @buksu.edu.ph (admin)."
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ ok: false, message: "Email already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role
    });

    const token = signToken(user);

    return res.json({
      ok: true,
      message: "Registered successfully.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Missing email/password." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid credentials." });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Invalid credentials." });
    }

    const token = signToken(user);

    return res.json({
      ok: true,
      message: "Logged in.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: "Email required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return ok (avoid leaking who exists)
    if (!user) return res.json({ ok: true, message: "If the email exists, a code was sent." });

    const code = make6DigitCode();
    user.resetCode = code;
    user.resetCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendResetCodeEmail(user.email, code);

    return res.json({ ok: true, message: "If the email exists, a code was sent." });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ ok: false, message: "Missing fields." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetCode || !user.resetCodeExpiresAt) {
      return res.status(400).json({ ok: false, message: "Invalid reset attempt." });
    }

    if (user.resetCode !== String(code).trim()) {
      return res.status(400).json({ ok: false, message: "Invalid code." });
    }

    if (user.resetCodeExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ ok: false, message: "Code expired." });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetCode = null;
    user.resetCodeExpiresAt = null;
    await user.save();

    return res.json({ ok: true, message: "Password updated. You can login now." });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};
