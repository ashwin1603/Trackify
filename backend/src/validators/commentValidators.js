const Joi = require("joi");

const addCommentSchema = Joi.object({
  bugId: Joi.string().uuid().required(),
  content: Joi.string().min(1).max(2000).required(),
});

module.exports = { addCommentSchema };
