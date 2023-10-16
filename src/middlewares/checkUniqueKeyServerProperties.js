const ServerProperties = require('../database/schemas/serverProperties');

const checkUniqueKeyServerProperties = async (req, res, next) => {
    try {
        const existingProperty = await ServerProperties.findOne({ key: req.body.key });
        if (existingProperty) {
            return res.status(400).json({ error: 'Server property with this key already exists' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Could not check key uniqueness' });
    }
};

module.exports= checkUniqueKeyServerProperties