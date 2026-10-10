const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  conversation: {type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true},
  auteur: {type: String, enum: ['client', 'vendeur'], required: true},
  auteurId: {type: mongoose.Schema.Types.ObjectId, required: true},
  type: {type: String, enum: ['texte', 'image', 'produit'], default: 'texte'},
  texte: {type: String, trim: true, maxlength: 2000},
  image: String,

  // Carte produit (copie figée : reste lisible même si l'article change ou est supprimé)
  article: {
    id: {type: mongoose.Schema.Types.ObjectId, ref: 'Article'},
    nom: String,
    prix: Number,
    prixreduit: Number,
    image: String
  },

  lu: {type: Boolean, default: false},
  luLe: Date
}, {timestamps: true});

chatMessageSchema.index({conversation: 1, _id: -1});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
