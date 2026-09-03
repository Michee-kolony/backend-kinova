const mongoose = require("mongoose");

const livraisonSchema = new mongoose.Schema(
    {
        numeroCommande: {
            type: String,
            required: true,
            unique: true
        },

        idLivreur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Livreur",
            required: true
        },

        nomLivreur: {
            type: String,
            required: true
        },

        photoLivreur: {
            type: String,
            default: null
        },

        telephoneLivreur: {
            type: String,
            required: true
        },

        position: {
            latitude: {
                type: Number,
                required: true
            },

            longitude: {
                type: Number,
                required: true
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Livraison", livraisonSchema);
