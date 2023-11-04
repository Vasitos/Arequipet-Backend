const Gamedig = require('gamedig');
const ServerProperties = require('../database/schemas/serverProperties');
const fs = require('fs');
const databaseOperations = require('../database/repositories/serverProperties/index');
const updateConfigUseCase = require('../application/serverProperties/updateServerPropertiesUseCase');

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

            const existingProperty = await databaseOperations.findPropertyByKey(cleanedKey);

            if (existingProperty) {
                existingProperty.value = cleanedValue;
                await existingProperty.save();
            } else {
                const type = determinePropertyType(cleanedValue);
                await databaseOperations.createProperty(cleanedKey, cleanedValue, category._id, type);
            }
        }

        return res.status(201).json({ error: false, message: 'Configuration mapped and saved successfully' });
    } catch (err) {
        console.error('Error reading or saving the configuration:', err);
        return res.status(500).json({ error: true, message: 'Error reading or saving the configuration' });
    }
}

function determinePropertyType(value) {
    console.log(value)
    if (value === '') {
        return 'unknown';
    } else if (value === 'true' || value === 'false') {
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

async function getServerPropertiesForSetup(req, res) {
    try {
        const serverProperties = await databaseOperations.getPropertiesForSetup();
        const result = {};
        serverProperties.forEach((category) => {
            result[category.category] = category.default;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch server properties' });
    }
}

async function getServerPropertyByKeyOrId(req, res) {
    try {
        const keyOrId = req.params.value;
        let serverProperty;

        if (keyOrId.match(/^[0-9a-fA-F]{24}$/)) {
            serverProperty = await databaseOperations.getServerPropertyById(keyOrId);
        }

        if (!serverProperty) {
            serverProperty = await databaseOperations.findPropertyByKey(keyOrId);
        }

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
        const keyOrId = req.params.value;
        let category;
        if (keyOrId.match(/^[0-9a-fA-F]{24}$/)) {
            category = await databaseOperations.getCategoryById(keyOrId);
        }

        if (!category) {
            category = await databaseOperations.getCategoryByKey(keyOrId);
        }

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch server properties' });
    }
}

async function updateProperties(req, res) {
    const data = req.body;
    try {
        const { updatedKeys, skippedKeys, unchangedKeys, transactionSuccessful } = 
            await updateConfigUseCase.processConfigData(data);
        if (transactionSuccessful) {
            const responseMessage = updateConfigUseCase.buildResponseMessage(updatedKeys, skippedKeys, unchangedKeys);
            return res.status(200).json({ error: false, message: responseMessage, updatedKeys, skippedKeys, unchangedKeys });
        } else {
            return res.status(500).json({ error: true, message: 'Transaction failed. Changes rolled back.' });
        }
    } catch (err) {
        console.error('Error updating properties:', err);
        return res.status(500).json({ error: true, message: 'Error updating properties' });
    }
}

module.exports = {
    getServerProperties,
    getServerPropertyByKeyOrId,
    updateServerProperty,
    deleteServerProperty,
    createCategory,
    getServerInformation,
    mapConfiguration,
    getServerCategories,
    getServerPropertiesByCategory,
    updateProperties,
    getServerPropertiesForSetup
};