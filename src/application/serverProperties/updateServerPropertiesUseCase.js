const fs = require('fs');
const databaseOperations = require('../../database/repositories/serverProperties/index');


async function readConfigAndInitializeData() {
    const filePath = process.env.SERVERPROPERTIES;
    let currentConfig = await fs.promises.readFile(filePath, 'utf8');
    let originalProperties = {};
    return { currentConfig, originalProperties };
}

async function processConfigData(data) {
    let { currentConfig, originalProperties } = await readConfigAndInitializeData();

    const updatedKeys = [];
    const skippedKeys = [];
    const unchangedKeys = [];
    let transactionSuccessful = true;

    for (const key in data) {
        const value = data[key];

        if (!key || value === undefined || value === null) {
            skippedKeys.push(key);
            continue;
        }

        const { cleanedKey, cleanedValue, existingProperty } = await preparePropertyData(key, value);
        if (!existingProperty) {
            skippedKeys.push(cleanedKey);
            continue;
        }

        if (existingProperty.value === cleanedValue) {
            unchangedKeys.push(cleanedKey);
            continue;
        }

        currentConfig = updateConfigValue(currentConfig, cleanedKey, cleanedValue);
        originalProperties[cleanedKey] = existingProperty.value;

        let configUpdated = await updateExistingProperty(existingProperty, cleanedKey, cleanedValue, updatedKeys, skippedKeys, originalProperties);
        if (!configUpdated) {
            transactionSuccessful = false;
        }
    }

    try {
        const filePath = process.env.SERVERPROPERTIES;
        await fs.promises.writeFile(filePath, currentConfig, 'utf8');
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

    return { updatedKeys, skippedKeys, unchangedKeys, transactionSuccessful };
}

async function preparePropertyData(key, value) {
    const cleanedKey = key;
    const cleanedValue = value;
    const existingProperty = await databaseOperations.findPropertyByKey(cleanedKey);
    return { cleanedKey, cleanedValue, existingProperty };
}

function isStringType(type) {
    return type === 'string';
}

function isBoolType(type) {
    return type === 'bool';
}

function isNumberType(type) {
    return type === 'number';
}

async function updateExistingProperty(existingProperty, cleanedKey, cleanedValue, updatedKeys, skippedKeys, originalProperties) {
    const { type, data, isArray } = existingProperty;

    function isValidString() {
        if (typeof cleanedValue !== 'string') {
            return false;
        }

        if (data && data.regex !== null) {
            const regexPattern = new RegExp(data.regex);
            if (!regexPattern.test(cleanedValue)) {
                return false;
            }
        }

        if (data && data.range && data.range.min !== null && data.range.max !== null) {
            const valueLength = cleanedValue.length;
            if (valueLength < data.range.min || valueLength > data.range.max) {
                return false;
            }
        }

        if (data && data.allowUserInput === false && data.values !== null && isArray) {
            if (!data.values.includes(cleanedValue)) {
                return false;
            }
        }

        return true;
    }

    function isValidBool() {
        return typeof cleanedValue === 'boolean';
    }

    function isValidNumber() {
        const numericValue = parseFloat(cleanedValue);
        if (isNaN(numericValue)) {
            return false;
        }

        
        if (data && data.range && data.range.min !== null && data.range.max !== null) {
            return numericValue >= data.range.min && numericValue <= data.range.max;
        }
        return true;
    }

    async function handlePropertyUpdate() {
        try {
            existingProperty.value = cleanedValue;
            await existingProperty.save();
            updatedKeys.push(cleanedKey);
            return true;
        } catch (dbUpdateError) {
            existingProperty.value = originalProperties[cleanedKey];
            skippedKeys.push(cleanedKey);
            return false;
        }
    }

    if (isStringType(type) && isValidString()) {
        return await handlePropertyUpdate();
    } else if (isBoolType(type) && isValidBool()) {
        return await handlePropertyUpdate();
    } else if (isNumberType(type) && isValidNumber()) {
        existingProperty.value = parseFloat(cleanedValue);
        return await handlePropertyUpdate();
    } else {
        skippedKeys.push(cleanedKey);
        return false;
    }
}


function buildResponseMessage(updatedKeys, skippedKeys, unchangedKeys) {
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
    return responseMessage;
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
    buildResponseMessage,
    processConfigData
};