const authService = require("../services/authService");

async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.body, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { signup, login };
