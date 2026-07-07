import { AppError } from "../utils/helpers.js";

// Factory: pass a Joi schema, get middleware that validates req.body.
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    // abortEarly:false collects ALL problems, so the user fixes
    // everything in one round instead of error-by-error
    throw new AppError(error.details.map((d) => d.message).join(", "), 400);
  }
  next();
};

export default validate;
