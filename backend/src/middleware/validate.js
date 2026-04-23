const AppError = require("../utils/appError");

function validate(schema, source = "body") {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return next(new AppError(error.details.map((d) => d.message).join(", "), 400));
    }
    req[source] = value;
    return next();
  };
}

module.exports = validate;
