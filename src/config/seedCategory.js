const ServerPropertiesCategory = require('../database/schemas/serverPropertiesCategory');

const categoryData = [
    { key: 'gameplay' },
    { key: 'networkAndConnectivity' },
    { key: 'worldAndEnvironment' },
    { key: 'managementAndAdministration' },
    { key: 'security' },
    { key: 'serverMessages' },
    { key: 'resourcePacks' },
    { key: 'other' },
    { key: 'default' }
];

async function seedCategories() {
    try {
        for (const data of categoryData) {
            const existingCategory = await ServerPropertiesCategory.findOne({ key: data.key });

            if (!existingCategory) {
                await ServerPropertiesCategory.create(data);
                console.log(`Category '${data.key}' created.`);
            } else {
                console.log(`Category '${data.key}' already exists, no action needed.`);
            }
        }
    } catch (error) {
        console.error('Error seeding categories:', error);
    }
}

module.exports = seedCategories;
