/**
 * Global API Token Validation Middleware
 * Validates API key for all requests
 */

const prisma = require("../config/prisma");
const AppError = require("../utils/appError");

async function validateGlobalToken(req, _res, next) {
  try {
    // Health check endpoint bypasses API key validation
    if (req.path === "/api/health") {
      return next();
    }

    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      throw new AppError("API key is required (x-api-key header)", 403);
    }

    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
    });

    if (!key) {
      throw new AppError("Invalid API key", 403);
    }

    if (!key.active) {
      throw new AppError("API key is inactive", 403);
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    req.apiKey = key;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { validateGlobalToken };
