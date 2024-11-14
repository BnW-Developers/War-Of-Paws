import Joi from 'joi';

const schema = Joi.object({
  id: Joi.string().min(3).max(30).required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
  email: Joi.string().email(),
});

export const validateSignUp = (info) => {
  const { error, _ } = schema.validate(info);

  if (error) return false;

  return true;
};
