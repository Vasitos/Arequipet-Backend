let express = require('express');
let router = express.Router();
let { updateProperties,
    getServerProperties,
    getServerPropertyByKeyOrId,
    updateServerProperty,
    deleteServerProperty,
    createCategory,
    getServerInformation,
    mapConfiguration,
    getServerCategories,
    getServerPropertiesByCategory,
    getServerPropertiesForSetup }
    = require('../controllers/serverController')
let verifyToken = require('../middlewares/verifyToken')
let verifyPermissions = require('../middlewares/verifyPermissions')
let { serverPropertiesValidation, serverPropertiesKeyValueValidation } = require('../middlewares/serverPropertiesValidation')
const checkUniqueKeyServerPropertiesCategory = require('../middlewares/checkUniqueKeyServerPropertiesCategory')

// Properties
router.get('/', verifyToken, verifyPermissions(), getServerInformation);
router.get('/properties/category/:value', verifyToken, verifyPermissions(), getServerPropertiesByCategory);
router.get('/properties', verifyToken, verifyPermissions(), getServerProperties);
router.get('/properties/:value', verifyToken, verifyPermissions(), getServerPropertyByKeyOrId);
router.get('/properties/setup/keys', verifyToken, verifyPermissions(), getServerPropertiesForSetup);
router.post('/properties/map', verifyToken, verifyPermissions(), mapConfiguration);
router.patch('/properties/:id', verifyToken, verifyPermissions(), serverPropertiesValidation, updateServerProperty);
router.put('/properties/', verifyToken, verifyPermissions(), serverPropertiesKeyValueValidation, updateProperties);
router.delete('/properties/:id', verifyToken, verifyPermissions(), deleteServerProperty);
// Categories
router.get('/categories', verifyToken, verifyPermissions(), getServerCategories);
router.post('/categories', verifyToken, verifyPermissions(), checkUniqueKeyServerPropertiesCategory, createCategory);
module.exports = router;
