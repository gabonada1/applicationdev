const bcrypt = require("bcryptjs");
const crypto = require("crypto");
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

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signState(payload) {
  const encoded = base64UrlEncode(payload);
  const signature = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

function verifyState(state) {
  const [encoded, signature] = String(state || "").split(".");
  if (!encoded || !signature) return null;

  const expected = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(encoded)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = base64UrlDecode(encoded);
  if (!payload.exp || payload.exp < Date.now()) return null;

  return payload;
}

function getGoogleRedirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;

  const publicApiUrl = process.env.PUBLIC_API_URL;
  if (publicApiUrl) {
    return `${publicApiUrl.replace(/\/$/, "")}/api/auth/google/callback`;
  }

  return `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
}

function redirectToApp(res, appRedirectUri, params, directRedirect = false) {
  const targetUrl = `${appRedirectUri}?${params.toString()}`;
  if (directRedirect) {
    return res.redirect(targetUrl);
  }

  const androidIntentUrl = targetUrl.startsWith("exp://")
    ? targetUrl.replace(/^exp:\/\//, "intent://") + "#Intent;scheme=exp;package=host.exp.exponent;end"
    : targetUrl;
  const escapedUrl = targetUrl.replace(/"/g, "&quot;");
  const escapedIntentUrl = androidIntentUrl.replace(/"/g, "&quot;");

  return res.send(`
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Returning to app...</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fffdf8;
            color: #3f3d3a;
            font-family: Arial, sans-serif;
          }
          main {
            width: min(420px, calc(100% - 40px));
            text-align: center;
          }
          a {
            display: inline-block;
            margin-top: 16px;
            padding: 14px 18px;
            border-radius: 16px;
            background: #f6c627;
            color: #3f3d3a;
            font-weight: 800;
            text-decoration: none;
          }
          p {
            color: #8e8779;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Opening the app...</h1>
          <p>If nothing happens, tap the button below to finish signing in.</p>
          <a href="${escapedIntentUrl}">Open applicationdev</a>
        </main>
        <script>
          window.location.href = ${JSON.stringify(targetUrl)};
          setTimeout(function () {
            window.location.href = ${JSON.stringify(androidIntentUrl)};
          }, 700);
        </script>
      </body>
    </html>
  `);
}

function make6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildResetCodeEmail(code) {
  return `
    <div style="margin:0;padding:32px 0;background:#f7f4ec;font-family:Arial,sans-serif;color:#3f3d3a;">
      <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #eadfca;border-radius:28px;overflow:hidden;box-shadow:0 16px 40px rgba(143,134,115,0.12);">
        <div style="padding:28px 28px 18px;background:linear-gradient(180deg,#fff7de 0%,#fffdf8 100%);border-bottom:1px solid #f0e3c4;">
          <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#fff0bf;border:1px solid #efd68c;font-size:11px;font-weight:700;letter-spacing:1px;color:#c88a00;">
            APPLICATIONDEV
          </div>
          <h1 style="margin:18px 0 8px;font-size:30px;line-height:1.15;color:#3f3d3a;">
            Password Reset Code
          </h1>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#8e8779;">
            Use the verification code below to reset your password. This code expires in 10 minutes.
          </p>
        </div>

        <div style="padding:28px;">
          <div style="padding:18px;border-radius:22px;background:#fff8e8;border:1px solid #efe2c2;text-align:center;">
            <div style="font-size:12px;letter-spacing:1.3px;text-transform:uppercase;font-weight:700;color:#8e8779;">
              Your Reset Code
            </div>
            <div style="margin-top:12px;font-size:38px;letter-spacing:8px;font-weight:800;color:#c88a00;">
              ${code}
            </div>
          </div>

          <div style="margin-top:22px;padding:18px 18px 2px;border-radius:20px;background:#fffbef;border:1px solid #eedfb7;">
            <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#3f3d3a;">
              If you did not request a password reset, you can safely ignore this email.
            </p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#8e8779;">
              For your security, never share this code with anyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
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
    html: buildResetCodeEmail(code)
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
      user: publicUser(user)
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

    if (!user.passwordHash) {
      return res.status(400).json({ ok: false, message: "This account has no password set." });
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
      user: publicUser(user)
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

exports.googleStart = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ ok: false, message: "GOOGLE_CLIENT_ID is not configured." });
    }

    const appRedirectUri = req.query.app_redirect_uri || `${process.env.APP_SCHEME || "applicationdev"}://google-auth`;
    const state = signState({
      appRedirectUri,
      directRedirect: req.query.direct_redirect === "1",
      exp: Date.now() + 10 * 60 * 1000
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getGoogleRedirectUri(req),
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

exports.googleCallback = async (req, res) => {
  const state = verifyState(req.query.state);
  const fallbackRedirect = `${process.env.APP_SCHEME || "applicationdev"}://google-auth`;
  const appRedirectUri = state?.appRedirectUri || fallbackRedirect;

  function redirectWithError(message) {
    const params = new URLSearchParams({ error: message });
    return redirectToApp(res, appRedirectUri, params, state?.directRedirect);
  }

  try {
    if (!state) return redirectWithError("Invalid or expired Google sign-in session.");
    if (req.query.error) return redirectWithError(String(req.query.error));
    if (!req.query.code) return redirectWithError("Missing Google authorization code.");

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return redirectWithError("Google OAuth is not configured on the server.");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(req.query.code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getGoogleRedirectUri(req),
        grant_type: "authorization_code"
      }).toString()
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return redirectWithError(tokenData.error_description || "Google token exchange failed.");
    }

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.email) {
      return redirectWithError("Could not read Google profile.");
    }

    const email = String(profile.email).toLowerCase().trim();
    const role = roleFromEmail(email);
    if (!role) {
      return redirectWithError("Email must end with @gmail.com or @student.buksu.edu.ph.");
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: profile.name || email.split("@")[0],
        email,
        passwordHash: null,
        role
      });
    } else if (!user.name && profile.name) {
      user.name = profile.name;
      await user.save();
    }

    const params = new URLSearchParams({
      token: signToken(user),
      user: JSON.stringify(publicUser(user))
    });

    return redirectToApp(res, appRedirectUri, params, state?.directRedirect);
  } catch (err) {
    return redirectWithError(err.message || "Google sign-in failed.");
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

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body || {};
    const trimmedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!trimmedName || !normalizedEmail) {
      return res.status(400).json({ ok: false, message: "Name and email are required." });
    }

    const role = roleFromEmail(normalizedEmail);
    if (!role) {
      return res.status(400).json({
        ok: false,
        message: "Email must end with @gmail.com (student) or @buksu.edu.ph (admin)."
      });
    }

    if (role !== req.user.role) {
      return res.status(400).json({
        ok: false,
        message: "Email must stay within your current account role."
      });
    }

    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user.id }
    });

    if (existing) {
      return res.status(409).json({ ok: false, message: "Email already registered." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }

    user.name = trimmedName;
    user.email = normalizedEmail;

    const nextPassword = String(newPassword || "");
    if (nextPassword.trim()) {
      if (!String(currentPassword || "").trim()) {
        return res.status(400).json({
          ok: false,
          message: "Current password is required to set a new password."
        });
      }

      const matches = await bcrypt.compare(String(currentPassword), user.passwordHash || "");
      if (!matches) {
        return res.status(401).json({ ok: false, message: "Current password is incorrect." });
      }

      if (nextPassword.trim().length < 6) {
        return res.status(400).json({
          ok: false,
          message: "New password must be at least 6 characters."
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(nextPassword.trim(), salt);
    }

    await user.save();

    const token = signToken(user);

    return res.json({
      ok: true,
      message: "Profile updated.",
      token,
      user: publicUser(user)
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};
