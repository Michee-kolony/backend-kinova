const mongoose = require('mongoose');

// Une conversation par couple client / vendeur (comme Alibaba) :
// les produits discutés apparaissent sous forme de cartes dans le fil.
const conversationSchema = new mongoose.Schema({
  client: {type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true},
  vendeur: {type: mongoose.Schema.Types.ObjectId, ref: 'Vendeur', required: true},

  // Dernier produit au sujet duquel le client a écrit
  article: {
    id: {type: mongoose.Schema.Types.ObjectId, ref: 'Article'},
    nom: String,
    prix: Number,
    image: String
  },

  dernierMessage: {
    texte: String,
    type: {type: String, enum: ['texte', 'image', 'produit']},
    auteur: {type: String, enum: ['client', 'vendeur']},
    date: Date
  },

  nonLus: {
    client: {type: Number, default: 0},
    vendeur: {type: Number, default: 0}
  },

  // Conversation supprimée de la liste d'un des deux participants
  masque: {
    client: {type: Boolean, default: false},
    vendeur: {type: Boolean, default: false}
  }
}, {timestamps: true});

conversationSchema.index({client: 1, vendeur: 1}, {unique: true});
conversationSchema.index({client: 1, updatedAt: -1});
conversationSchema.index({vendeur: 1, updatedAt: -1});

module.exports = mongoose.model('Conversation', conversationSchema);
