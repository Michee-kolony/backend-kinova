const mongoose = require("mongoose");

const vendeurPayeSchema = new mongoose.Schema(
    {
        // =====================================
        // VENDEUR
        // =====================================

        vendeurId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendeur",
            required: true,
            index: true
        },

        // =====================================
        // COMMANDE
        // =====================================

        commandeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Commande",
            required: true,
            index: true
        },

        numeroCommande: {
            type: String,
            required: true,
            index: true
        },

        // =====================================
        // ARTICLES DU VENDEUR
        // =====================================

        articles: [
            {
                articleId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },

                nomArticle: {
                    type: String,
                    required: true
                },

                quantite: {
                    type: Number,
                    required: true,
                    default: 1
                },

                prixUnitaire: {
                    type: Number,
                    required: true
                },

                montant: {
                    type: Number,
                    required: true
                }
            }
        ],

        // =====================================
        // PAWAPAY
        // =====================================

        payoutId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        providerTransactionId: {
            type: String,
            default: null
        },

        // =====================================
        // MONTANT
        // =====================================

        montant: {
            type: Number,
            required: true
        },

        devise: {
            type: String,
            required: true,
            default: "USD"
        },

        // =====================================
        // DESTINATAIRE
        // =====================================

        telephone: {
            type: String,
            required: true
        },

        operateur: {
            type: String,
            required: true
        },

        // =====================================
        // STATUT
        // =====================================

        statut: {
            type: String,

            enum: [
                "EN_ATTENTE",
                "ACCEPTED",
                "COMPLETED",
                "FAILED"
            ],

            default: "EN_ATTENTE",

            index: true
        },

        // =====================================
        // ADMIN
        // =====================================

        effectuePar: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        // =====================================
        // DATE DU PAIEMENT EFFECTIF
        // =====================================

        datePaiement: {
            type: Date,
            default: null
        },

        // =====================================
        // PAWAPAY
        // =====================================

        pawapayStatus: {
            type: String,
            default: null
        },

        // =====================================
        // ERREUR
        // =====================================

        failureReason: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "VendeurPaye",
    vendeurPayeSchema
);