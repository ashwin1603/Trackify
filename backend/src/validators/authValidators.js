const Joi = require("joi");
const { ROLES } = require("../utils/constants");

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,64}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must be 8–64 characters and include uppercase, lowercase, a number, and a special character",
    }),
  roleName: Joi.string()
    .valid(ROLES.DEVELOPER, ROLES.TESTER)
    .default(ROLES.DEVELOPER)
    .required(),
  // dob is required for DEVELOPER role, optional (can be omitted) for all other roles
  dob: Joi.when("roleName", {
    is: ROLES.DEVELOPER,
    then: Joi.string().isoDate().required().messages({
      "any.required": "Date of birth is required for developer accounts",
      "string.isoDate": "Date of birth must be a valid date (YYYY-MM-DD)",
    }),
    otherwise: Joi.string().isoDate().optional(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { signupSchema, loginSchema };
