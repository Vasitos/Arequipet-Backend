const ServerPropertiesCategory = require('../database/schemas/serverPropertiesCategory');

const checkCategoryExists = async (req, res, next) => {
    try {
      const categoryId = req.body.category;
      const category = await ServerPropertiesCategory.findById(categoryId);
  
      if (!category) {
        return res.status(400).json({ error: 'Category does not exist' });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Could not check category existence' });
    }
  };

module.exports= checkCategoryExists
