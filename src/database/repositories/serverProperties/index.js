const ServerProperties = require('../../schemas/serverProperties');
const ServerPropertiesCategory = require('../../schemas/serverPropertiesCategory');
const mongoose = require('mongoose');

async function findCategoryByKey(key) {
    return await ServerPropertiesCategory.findOne({ key: { $eq: key } });
}

async function findPropertyByKeyAndCategory(key, category) {
    return await ServerProperties.findOne({ key, category });
}

async function findPropertyByKey(key) {
    return await ServerProperties.findOne({ key: { $eq: key } });
}


async function createServerProperty(data) {
    try {
        const newServerProperty = await ServerProperties.create(data);
        return newServerProperty;
    } catch (error) {
        throw error;
    }
}

async function updateServerPropertyById(id, data) {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Invalid 'id' parameter.");
        }
        const updatedServerProperty = await ServerProperties.findByIdAndUpdate(id, data, { new: true });
        return updatedServerProperty;
    } catch (error) {
        throw error;
    }
}

async function deleteServerPropertyById(id) {
    try {
        const deletedServerProperty = await ServerProperties.findByIdAndRemove(id);
        return deletedServerProperty;
    } catch (error) {
        throw error;
    }
}

async function getServerPropertyById(id) {
    try {
        const serverProperty = await ServerProperties.findById(id).populate('category');
        return serverProperty;
    } catch (error) {
        throw error;
    }
}

async function createCategory(data) {
    try {
        const newCategory = await ServerPropertiesCategory.create(data);
        return newCategory;
    } catch (error) {
        throw error;
    }
}

async function getCategories() {
    try {
        const categories = await ServerPropertiesCategory.find();
        return categories;
    } catch (error) {
        throw error;
    }
}

async function createProperty(key, value, category, type) {
    const serverProperty = new ServerProperties({
        key,
        type,
        default: value,
        value,
        data: null,
        category,
    });
    return serverProperty.save();
}

async function getProperties() {
    try {
        const pipeline = [
            {
                $lookup: {
                    from: 'serverpropertiescategories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: '$category'
            },
            {
                $group: {
                    _id: '$category.key',
                    default: {
                        $push: {
                            _id: '$_id',
                            key: '$key',
                            type: '$type',
                            value: '$value',
                            default: '$default',
                            data: '$data',
                            category: '$category._id',
                            isConfigured: '$isConfigured',
                            isArray: '$isArray'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    default: 1
                }
            }
        ];
        const properties = await ServerProperties.aggregate(pipeline);
        return properties;
    } catch (error) {
        throw error;
    }
}

async function getPropertiesByCategory(categoryId) {
    try {
        const properties = await ServerProperties.find({ category: categoryId });
        return properties;
    } catch (error) {
        throw error;
    }
}

async function getCategoryById(categoryId) {
    try {
        const category = await ServerPropertiesCategory.findById(categoryId);
        return category;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createServerProperty,
    updateServerPropertyById,
    deleteServerPropertyById,
    getServerPropertyById,
    createCategory,
    getCategories,
    getPropertiesByCategory,
    getProperties,
    findCategoryByKey,
    findPropertyByKeyAndCategory,
    createProperty,
    getCategoryById,
    findPropertyByKey
};
