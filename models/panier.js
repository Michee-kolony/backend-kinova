const mongoose = require('mongoose');

// Schéma pour un article dans le panier
const ArticlePanierSchema = new mongoose.Schema({
  articleId: {type: String, required: true},
  nom: {type: String, required: true},
  prix: {type: Number, required: true},
  reduction: {type: Number, default: 0},
  categorie: {type: String, required: true},
  genre: {type: String, required: true},
  description: {type: String, required: true},
  images: {type: [String], required: true},
  stock: {type: Number, required: true},
  couleurs: {type: [String], default: []},
  tailles: {type: [String], default: []},
  vendeurId: {type: String, required: true},
  vendeurNom: {type: String, required: true},
  vendeurTelephone: {type: String, required: true},
  createdAt: {type: String},
  prixreduit: {type: Number},
  prixFinal: {type: Number},
  // Ce sont les seuls champs spécifiques au panier
  quantite: {type: Number, required: true, default: 1, min: 1},
  couleurChoisie: {type: String, default: null},
  tailleChoisie: {type: String, default: null},
  ajouteLe: {type: Date, default: Date.now}
});

// Schéma principal du panier (TRÈS SIMPLE)
const Panierschema = new mongoose.Schema(
  {
    utilisateurId: {
      type: String,
      required: true,
      index: true
    },
    articles: {
      type: [ArticlePanierSchema],
      default: []
    },
    codePromo: {
      type: String,
      default: null
    },
    statut: {
      type: String,
      enum: ['actif', 'abandonne', 'commande'],
      default: 'actif'
    }
  },
  {
    timestamps: true
  }
);

// Index pour les requêtes fréquentes
Panierschema.index({ utilisateurId: 1, statut: 1 });

const Panier = mongoose.model('Panier', Panierschema);

module.exports = Panier;