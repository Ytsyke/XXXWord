const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Уникальный ID документа (например, "work-1")
    data: { type: Object, required: true }, // Здесь будет храниться HTML или дельты текста
});

module.exports = mongoose.model('Document', DocumentSchema);