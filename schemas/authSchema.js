import joi from "joi";

export const signUpSchema = joi.object({
  name: joi.string().required().trim(),
  email: joi.string().required().email(),
  password: joi.string().required().trim(),
  confirmPassword: joi.string().required().trim(),
});

export const signInSchema = joi.object({
  email: joi.string().required().email(),
  password: joi.string().required().trim(),
});
