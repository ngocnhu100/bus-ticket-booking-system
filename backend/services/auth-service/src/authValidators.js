const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
    .required(), // Vietnamese phone
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),
  fullName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('passenger', 'admin').default('passenger'),
});

const loginSchema = Joi.object({
  identifier: Joi.string().required(), // email or phone
  password: Joi.string().required(),
});

const googleAuthSchema = Joi.object({
  idToken: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
