const { serverPropertyValidation, serverPropertyKeyValueValidation } = require('../utils/serverPropertiesValidationSchema');

async function serverPropertiesValidation(req, res, next) {
    const { error, value } = serverPropertyValidation(req.body);

    if (error) {
        const messages = error.details.map((message) => message.message);
                const invalidValues = error.details.map((message) => message.context.key);

        return res.status(400).json({
            error: true,
            message: messages,
            invalidValues: invalidValues,
        });
    } else {
        return next();
    }
}

async function serverPropertiesKeyValueValidation(req, res, next) {
    const { error, value } = serverPropertyKeyValueValidation(req.body);

    if (error) {
        const messages = error.details.map((message) => message.message);
                const invalidValues = error.details.map((message) => message.context.key);

        return res.status(400).json({
            error: true,
            message: messages,
            invalidValues: invalidValues,
        });
    } else {
        return next();
    }
}

module.exports = {
    serverPropertiesValidation,
    serverPropertiesKeyValueValidation
};
