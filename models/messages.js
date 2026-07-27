const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    nom: {type: String, required: true},
    email: {type: String, required: true},
    objet: {type: String, required: true},
    message: {type: String, required: true},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Messages', messageSchema);