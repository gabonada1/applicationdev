const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const {
  register,
  login,
  googleStart,
  googleCallback,
  forgotPassword,
  resetPassword,
  updateProfile
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/google/start", googleStart);
router.get("/google/callback", googleCallback);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/me", requireAuth, updateProfile);

module.exports = router;
