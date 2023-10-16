const mongoose = require('mongoose');

const serverPropertiesCategorySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  }
});

const ServerPropertiesCategory = mongoose.model('ServerPropertiesCategory', serverPropertiesCategorySchema);

module.exports = ServerPropertiesCategory;
