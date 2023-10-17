const repository = require("../database/repositories/serverProperties/index")
const checkUniqueKeyServerPropertiesCategory = async (req, res, next) => {
    try {
        const existingCategory = await repository.findCategoryByKey(req.body.key);
        if (existingCategory) {
            return res.status(400).json({ error: 'Category with this key already exists' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Could not check key uniqueness' });
    }
};

module.exports= checkUniqueKeyServerPropertiesCategory
