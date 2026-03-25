const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    data: { type: String, default: "" }, // Храним чистый HTML
});

module.exports = mongoose.model('Document', DocumentSchema);