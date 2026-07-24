const mongoose = require('mongoose');

const vendeurSchema = new mongoose.Schema(
  {
    // =========================
    // INFORMATIONS DE CONNEXION
    // =========================

    email: {
      type: String,
      required: [true, "L'adresse e-mail est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
      minlength: [
        6,
        "Le mot de passe doit contenir au moins 6 caractères"
      ]
    },


    // =========================
    // INFORMATIONS DE LA BOUTIQUE
    // =========================
 storeName: {
  type: String,
  required: [
    true,
    "Le nom de la boutique est obligatoire"
  ],
  unique: true,
  lowercase: true,
  trim: true
},

    storeCategory: {
      type: String,
      required: [
        true,
        "La catégorie de la boutique est obligatoire"
      ],
      trim: true
    },

    profilePhoto: {
      type: String,
      required: [
        true,
        "La photo de profil est obligatoire"
      ]
    },

    phoneNumber: {
      type: String,
      required: [
        true,
        "Le numéro de téléphone est obligatoire"
      ],
      trim: true
    },

    address: {
      type: String,
      required: [
        true,
        "L'adresse est obligatoire"
      ],
      trim: true
    },


    // =========================
    // INFORMATIONS DE PAIEMENT
    // =========================

    paymentMethod: {
      type: String,
      enum: [
        "mobile_money",
        "card"
      ],
      required: [
        true,
        "Le mode de paiement est obligatoire"
      ]
    },

    mobileMoneyNumber: {
      type: String,
      trim: true
    },

    paymentCustomerId: {
      type: String,
      default: null
    },

    paymentMethodId: {
      type: String,
      default: null
    },


    // =========================
    // STATUT DU VENDEUR
    // =========================
    resetPasswordCode: {
  type: String,
  default: null
},

resetPasswordExpires: {
  type: Date,
  default: null
},

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "suspended",
        "blocked"
      ],
      default: "pending"
    },

    isVerified: {
      type: Boolean,
      default: false
    }

  },

  {
    timestamps: true
  }
);


module.exports = mongoose.model("Vendeur", vendeurSchema);