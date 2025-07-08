import Joi from "joi";


//==================================Contact Validation Schemas======================================

export const createContactValidator = Joi.object({
   name: Joi.string().required().min(2).max(10).trim(),
   phone: Joi.string().required().length(11).pattern(/^\d{11}$/).messages({
      'string.pattern.base': 'Phone number should contain only 11 numbers'
   }),
   address: Joi.string().required().min(5).max(50).trim(),
   notes: Joi.string().optional().max(200).trim().allow('', null)
});


export const updateContactValidator = Joi.object({
   name: Joi.string().optional().min(2).max(10).trim(),
   phone: Joi.string().optional().length(11).pattern(/^\d{11}$/).messages({
      'string.pattern.base': 'Phone number should contain only 11 numbers'
   }),
   address: Joi.string().optional().min(5).max(50).trim(),
   notes: Joi.string().optional().max(200).trim().allow('', null)
});


export const contactIdValidator = Joi.object({
   id: Joi.string().required().hex().length(24).messages({
      'string.hex': 'Invalid contact ID format',
      'string.length': 'Contact ID must be exactly 24 characters'
   })
});


export const contactQueryValidator = Joi.object({
   page: Joi.number().optional().min(1).default(1),
   limit: Joi.number().optional().min(1).max(50).default(5),
   search: Joi.string().optional().max(100).trim().allow(''),
   sortBy: Joi.string().optional().valid('name', 'phone', 'address', 'createdAt').default('createdAt'),
   sortOrder: Joi.string().optional().valid('asc', 'desc').default('desc')
}); 