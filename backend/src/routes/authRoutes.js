const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const { loginSchema, signupSchema } = require("../validators/authValidators");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased to 50 to accommodate rapid QA testing across multiple roles
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, try again later." },
});

router.post("/signup", validate(signupSchema), authController.signup);
router.post("/login", loginLimiter, validate(loginSchema), authController.login);

module.exports = router;
