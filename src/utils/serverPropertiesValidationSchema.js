const Joi = require('joi');

const serverPropertyValidation = (body) => {
    const serverPropertySchema = Joi.object({
        type: Joi.string().optional(),
        default: Joi.any().optional(),
        data: Joi.any().optional(),
        category: Joi.string().optional(),
        isConfigured: Joi.boolean().optional(),
        isArray: Joi.boolean().optional(),
    }).unknown(false).options({ abortEarly: false });
    return serverPropertySchema.validate(body);
};


const serverPropertyKeyValueValidation = (body) => {
    const schema = Joi.array().items(
        Joi.object({
            key: Joi.string().required(),
            value: Joi.any().required(),
        }).unknown(false).options({ abortEarly: false })
    );
    return schema.validate(body);
};

module.exports= {
    serverPropertyValidation,
    serverPropertyKeyValueValidation
};