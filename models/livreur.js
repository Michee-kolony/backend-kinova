const mongoose = require('mongoose');

const LivreurShema = mongoose.Schema({

    nom: { type: String, required: true },
    email : { type: String, required: true },
    password: { type: String, required: true },
    telephone: { type: String, required: true },
    photo: { type: String, required: true },
    dateInscription: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Livreur', LivreurShema);