const Joi = require("joi");
const { BUG_STATUS } = require("../utils/constants");

const createBugSchema = Joi.object({
  title: Joi.string().min(3).max(160).required(),
  description: Joi.string().min(8).required(),
  status: Joi.string()
    .valid(BUG_STATUS.OPEN, BUG_STATUS.IN_PROGRESS, BUG_STATUS.RESOLVED, BUG_STATUS.CLOSED)
    .optional(),
  assigneeId: Joi.string().uuid().optional().allow(null),
});

const updateBugSchema = Joi.object({
  title: Joi.string().min(3).max(160).optional(),
  description: Joi.string().min(8).optional(),
  status: Joi.string()
    .valid(BUG_STATUS.OPEN, BUG_STATUS.IN_PROGRESS, BUG_STATUS.RESOLVED, BUG_STATUS.CLOSED)
    .optional(),
  assigneeId: Joi.string().uuid().optional().allow(null),
})
  .min(1)
  .required();

const assignBugSchema = Joi.object({
  email: Joi.string().email().required(),
});

const bugQuerySchema = Joi.object({
  status: Joi.string()
    .valid(BUG_STATUS.OPEN, BUG_STATUS.IN_PROGRESS, BUG_STATUS.RESOLVED, BUG_STATUS.CLOSED)
    .optional(),
  assigneeId: Joi.string().uuid().optional(),
  search: Joi.string().max(100).optional(),
});

const idParamSchema = Joi.object({ id: Joi.string().uuid().required() });

module.exports = { createBugSchema, updateBugSchema, assignBugSchema, bugQuerySchema, idParamSchema };
