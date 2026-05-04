const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    data: { type: String, default: "" }, // Храним чистый HTML
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shareTokens: [{
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Document', DocumentSchema);