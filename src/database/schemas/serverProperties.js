const mongoose = require('mongoose');

const serverPropertiesSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  default: {
    type: mongoose.Schema.Types.Mixed
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  value: {
    type: mongoose.Schema.Types.Mixed
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServerPropertiesCategory'
  },
  isConfigured: {
    type: Boolean,
    default: false
  },
  isArray: {
    type: Boolean,
    default: false
  }
});

const ServerProperties = mongoose.model('ServerProperties', serverPropertiesSchema);

module.exports = ServerProperties;
