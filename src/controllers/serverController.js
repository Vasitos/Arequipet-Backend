const Gamedig = require('gamedig');
const ServerProperties = require('../database/schemas/serverProperties');
const fs = require('fs');
const databaseOperations = require('../database/repositories/serverProperties/index');

async function mapConfiguration(req, res) {
    const filePath = process.env.SERVERPROPERTIES;

    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const configLines = data.split('\n');
        const categoryKey = 'default';

        const category = await databaseOperations.findCategoryByKey(categoryKey);

        if (!category) {
            console.error('The "default" category was not found in the database');
            return res.status(500).json({ error: true, message: 'The "default" category was not found in the database' });
        }

        for (const line of configLines) {
            if (line.startsWith('#')) {
                continue;
            }
            const [key, value] = line.split('=');
            const cleanedKey = key.trim();
            let cleanedValue = value.trim();

            const existingProperty = await databaseOperations.findPropertyByKeyAndCategory(cleanedKey, category._id);

            if (existingProperty) {
                existingProperty.value = cleanedValue.toString();
                await existingProperty.save();
            } else {
                const type = determinePropertyType(cleanedValue);
                await databaseOperations.createProperty(cleanedKey, cleanedValue.toString(), category._id, type);
            }
        }

        return res.status(201).json({ error: false, message: 'Configuration mapped and saved successfully' });
    } catch (err) {
        console.error('Error reading or saving the configuration:', err);
        return res.status(500).json({ error: true, message: 'Error reading or saving the configuration' });
    }
}

function determinePropertyType(value) {
    if (value === 'true' || value === 'false') {
        return 'bool';
    } else if (!isNaN(value)) {
        return 'number';
    } else {
        return 'string';
    }
}

function getServerInformation(req, res) {
    Gamedig.query({
        type: 'minecraft',
        host: process.env.MINECRAFT_HOST
    }).then((state) => {
        const newJson = {
            name: state.name,
            maxplayers: state.maxplayers,
            players: state.players,
            bots: state.bots,
            connect: state.connect,
            ping: state.ping
        };
        return res.status(200).json({ error: false, message: "Information successfully obtained", information: newJson });
    }).catch(() => {
        return res.status(503).json({ error: false, message: "Cannot get the required information, server is down" });
    });
}

async function getServerProperties(req, res) {
    try {

        const serverProperties = await databaseOperations.getProperties();
        const result = {};
        serverProperties.forEach((category) => {
            result[category.category] = category.default;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch server properties' });
    }
}

async function getServerPropertyById(req, res) {
    try {
        const serverProperty = await databaseOperations.getServerPropertyById(req.params.id);
        if (!serverProperty) {
            return res.status(404).json({ error: 'Server property not found' });
        }
        res.json(serverProperty);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch server property' });
    }
}

async function updateServerProperty(req, res) {
    try {
        const updatedServerProperty = await databaseOperations.updateServerPropertyById(req.params.id, req.body);

        if (!updatedServerProperty) {
            return res.status(404).json({ error: 'Server property not found' });
        }
        res.json(updatedServerProperty);
    } catch (error) {
        res.status(500).json({ error: 'Could not update server property' });
    }
}

async function deleteServerProperty(req, res) {
    try {
        const deletedServerProperty = await databaseOperations.deleteServerPropertyById(req.params.id);
        if (!deletedServerProperty) {
            return res.status(404).json({ error: 'Server property not found' });
        }
        res.json(deletedServerProperty);
    } catch (error) {
        res.status(500).json({ error: 'Could not delete server property' });
    }
}

async function createCategory(req, res) {
    try {
        const newCategory = await databaseOperations.createCategory(req.body);
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ error: 'Could not create category' });
    }
}

async function getServerCategories(req, res) {
    try {
        const categories = await databaseOperations.getCategories();
        res.json(categories);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Could not fetch server categories' });
    }
}

async function getServerPropertiesByCategory(req, res) {
    try {
        const categoryId = req.params.categoryId;
        const category = await databaseOperations.getCategoryById(categoryId);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const properties = await databaseOperations.getPropertiesByCategory(categoryId);
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch server properties' });
    }
}

async function updateProperties(req, res) {
    const data = req.body;
    const filePath = process.env.SERVERPROPERTIES;

    try {
        const updatedKeys = [];
        const skippedKeys = [];
        const unchangedKeys = [];
        let transactionSuccessful = true;

        const currentConfig = await fs.promises.readFile(filePath, 'utf8');
        let updatedConfig = currentConfig;
        const originalProperties = {};

        for (const item of data) {
            if (item.key && item.value !== undefined && item.value !== null) {
                const cleanedKey = item.key;
                const cleanedValue = item.value;
                const existingProperty = await databaseOperations.findPropertyByKey(cleanedKey)

                if (existingProperty) {
                    if (existingProperty.value === cleanedValue) {
                        unchangedKeys.push(cleanedKey);
                        continue;
                    }

                    updatedConfig = updateConfigValue(updatedConfig, cleanedKey, cleanedValue);
                    originalProperties[cleanedKey] = existingProperty.value;
                    if (existingProperty.type === 'string') {
                        existingProperty.value = cleanedValue.toString();
                    } else if (existingProperty.type === 'bool') {
                        if (typeof cleanedValue === 'boolean') {
                            existingProperty.value = cleanedValue;
                        } else {
                            skippedKeys.push(cleanedKey);
                            transactionSuccessful = false;
                            continue;
                        }
                    } else if (existingProperty.type === 'number') {
                        if (!isNaN(cleanedValue)) {
                            existingProperty.value = parseFloat(cleanedValue);
                        } else {
                            skippedKeys.push(cleanedKey);
                            transactionSuccessful = false;
                            continue;
                        }
                    }
                    try {
                        await existingProperty.save();
                        updatedKeys.push(cleanedKey);
                    } catch (dbUpdateError) {
                        existingProperty.value = originalProperties[cleanedKey];
                        skippedKeys.push(cleanedKey);
                        transactionSuccessful = false;
                    }
                } else {
                    skippedKeys.push(cleanedKey);
                }
            }
        }

        try {
            await fs.promises.writeFile(filePath, updatedConfig, 'utf8');
        } catch (fileUpdateError) {
            console.error('Error updating the file:', fileUpdateError);
            transactionSuccessful = false;
            for (const key in originalProperties) {
                const existingProperty = await ServerProperties.findOne({ key });
                if (existingProperty) {
                    existingProperty.value = originalProperties[key];
                    await existingProperty.save();
                }
            }
        }

        if (transactionSuccessful) {
            let responseMessage = 'Properties updated successfully';
            if (updatedKeys.length > 0) {
                responseMessage += '. Updated keys: ' + updatedKeys.join(', ');
            }
            if (skippedKeys.length > 0) {
                responseMessage += '. Skipped keys: ' + skippedKeys.join(', ');
            }
            if (unchangedKeys.length > 0) {
                responseMessage += '. Unchanged keys: ' + unchangedKeys.join(', ');
            }

            return res.status(200).json({ error: false, message: responseMessage, updatedKeys, skippedKeys, unchangedKeys });
        } else {
            return res.status(500).json({ error: true, message: 'Transaction failed. Changes rolled back.' });
        }
    } catch (err) {
        console.error('Error updating properties:', err);
        return res.status(500).json({ error: true, message: 'Error updating properties' });
    }
}

function updateConfigValue(config, key, value) {
    const lines = config.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith(`${key}=`)) {
            lines[i] = `${key}=${value}`;
            break;
        }
    }
    return lines.join('\n');
}

module.exports = {
    getServerProperties,
    getServerPropertyById,
    updateServerProperty,
    deleteServerProperty,
    createCategory,
    getServerInformation,
    mapConfiguration,
    getServerCategories,
    getServerPropertiesByCategory,
    updateProperties
};