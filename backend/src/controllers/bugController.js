const bugService = require("../services/bugService");

async function listBugs(req, res, next) {
  try {
    const bugs = await bugService.listBugs(req.query, {
      userId: req.user.id,
      role: req.user.role?.name,
    });
    res.status(200).json({ data: bugs });
  } catch (error) {
    next(error);
  }
}

async function getBug(req, res, next) {
  try {
    const bug = await bugService.getBugById(req.params.id);
    res.status(200).json({ data: bug });
  } catch (error) {
    next(error);
  }
}

async function createBug(req, res, next) {
  try {
    const bug = await bugService.createBug(req.body, {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      mlAnalysis: req.mlAnalysis,
    });
    res.status(201).json({ data: bug });
  } catch (error) {
    next(error);
  }
}

async function updateBug(req, res, next) {
  try {
    const bug = await bugService.updateBug(req.params.id, req.body, {
      userId: req.user.id,
      role: req.user.role?.name,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      mlAnalysis: req.mlAnalysis,
    });
    res.status(200).json({ data: bug });
  } catch (error) {
    next(error);
  }
}

async function assignBug(req, res, next) {
  try {
    const bug = await bugService.assignBugByEmail(req.params.id, req.body.email, {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    res.status(200).json({ data: bug });
  } catch (error) {
    next(error);
  }
}

async function deleteBug(req, res, next) {
  try {
    await bugService.deleteBug(req.params.id, {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { listBugs, getBug, createBug, updateBug, assignBug, deleteBug };
