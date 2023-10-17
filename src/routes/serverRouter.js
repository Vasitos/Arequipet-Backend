let express = require('express');
let router = express.Router();
let { updateProperties,
    getServerProperties,
    getServerPropertyById,
    updateServerProperty,
    deleteServerProperty,
    createCategory,
    getServerInformation,
    mapConfiguration,
    getServerCategories,
    getServerPropertiesByCategory }
    = require('../controllers/serverController')
let verifyToken = require('../middlewares/verifyToken')
let verifyPermissions = require('../middlewares/verifyPermissions')
let { serverPropertiesValidation, serverPropertiesKeyValueValidation } = require('../middlewares/serverPropertiesValidation')
const checkUniqueKeyServerPropertiesCategory = require('../middlewares/checkUniqueKeyServerPropertiesCategory')

router.get('/', verifyToken, verifyPermissions(), getServerInformation);
// Properties
router.get('/properties/category/:categoryId', getServerPropertiesByCategory);
router.get('/properties', getServerProperties);
router.get('/properties/:id', getServerPropertyById);
router.post('/properties/map', mapConfiguration);
router.patch('/properties/:id', serverPropertiesValidation, updateServerProperty);
router.put('/properties/', serverPropertiesKeyValueValidation, updateProperties);
router.delete('/properties/:id', deleteServerProperty);
// Categories
router.get('/categories', getServerCategories);
router.post('/categories', checkUniqueKeyServerPropertiesCategory, createCategory);
module.exports = router;
