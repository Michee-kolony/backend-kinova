const mongoose = require("mongoose");


const tokenSchema = new mongoose.Schema({

    token: {
        type: String,
        required: true,
        unique: true
    },

    // Utilisateur connecté sur l'appareil (pour les notifications de messagerie)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },

    role: {
        type: String,
        enum: ["client", "vendeur"]
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});


module.exports = mongoose.model("Token", tokenSchema);
