const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  nom: {type: String, required: true, trim: true},
  prix: {type: Number, required: true},
  prixreduit: {type: Number},
  reduction: {type: Number, default: 0, min: 0, max: 100},
  categorie: {type: String, required: true,trim: true},
  genre: {type: String, enum: ['Homme', 'Femme', 'Mixte', 'Enfants'],
    set: (value) => {
      if (!value) return value;

      const v = value.toLowerCase().trim();

      if (v === 'homme' || v === 'h') return 'Homme';
      if (v === 'femme' || v === 'f') return 'Femme';
      if (v === 'mixte' || v === 'm') return 'Mixte';
      if (v === 'enfants' || v === 'enfant' || v === 'kids' || v === 'kid')
        return 'Enfants';

      return value;
    }
  },
  description: {type: String, required: true},
  images: {type: [String], default: []},
  // Nouveau : quantité disponible
  stock: {type: Number, default: 0, min: 0},
  // Nouveau : couleurs disponibles
  couleurs: {type: [String], default: []},
  // Nouveau : tailles disponibles
  tailles: {type: [String], default: []},
  vendeurId: {type: mongoose.Schema.Types.ObjectId, required: true},
  vendeurNom: {type: String, required: true},
  vendeurTelephone: {type: String, required: true},
  createdAt: {type: Date, default: Date.now}
});

// Calcul automatique du prix réduit
articleSchema.pre('save', async function () {

    if (this.reduction > 0) {
        this.prixreduit =
            this.prix - (this.prix * this.reduction / 100);
    } else {
        this.prixreduit = this.prix;
    }

});

// Virtual
articleSchema.virtual('prixFinal').get(function () {
  return this.prix - (this.prix * this.reduction / 100);
});

articleSchema.set('toJSON', { virtuals: true });
articleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Article', articleSchema);