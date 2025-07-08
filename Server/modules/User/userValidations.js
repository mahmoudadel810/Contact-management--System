import Joi from "joi";


export const loginValidator = Joi.object({
   userName: Joi.string().required(),
   password: Joi.string().required().min(5).max(20)
});



