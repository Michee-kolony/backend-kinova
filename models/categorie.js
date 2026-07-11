const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema({
  nom: {type: String, required: true, trim: true, unique: true},
  htag: {type: String, required: true},
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Categorie', categorieSchema);