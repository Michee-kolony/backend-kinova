const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  nom: {type: String, required: true, trim: true},
  prix: {type: Number, required: true},
  reduction: {type: Number, default: 0, min: 0, max: 100},
  categorie: {type: String, required: true, trim: true},
  description: {type: String, required: true},
  images: {type: [String], default: []},
  vendeurId: {type: mongoose.Schema.Types.ObjectId,  required: true},
  vendeurNom: {type: String,  required: true},
  vendeurTelephone: {type: String, required: true},
  createdAt: {type: Date, default: Date.now}
});

// Prix après réduction
articleSchema.virtual('prixFinal').get(function () {
  return this.prix - (this.prix * this.reduction / 100);
});

// Permet d'inclure le virtual dans les réponses JSON
articleSchema.set('toJSON', { virtuals: true });
articleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Article', articleSchema);