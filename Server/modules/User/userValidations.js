import Joi from "joi";





export const hardcodedUsersValidator = Joi.object({
   userName: Joi.string().required().min(3).max(20),
   password: Joi.string().required().min(5).max(20).pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,}$/),
});







export const loginValidator = Joi.object({
   userName: Joi.string().required().min(3).max(20),
   password: Joi.string().required().min(5).max(20).pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,}$/),
   // confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
   //    'any.only': 'Passwords do not match'
   // }),
});



