const Client = require('../models/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.registerClient = (req, res, next) => {

    if (!req.body) {
        return res.status(400).json({
            message: "Données manquantes"
        });
    }

    bcrypt.hash(req.body.password, 10)
        .then(hash => {

            const client = new Client({
                name: req.body.name,
                email: req.body.email,
                telephone: req.body.telephone,
                addresse: req.body.addresse,
                password: hash,
                genre: req.body.genre
            });

            return client.save();
        })
        .then(() => {
            res.status(201).json({
                message: 'Client enregistré avec succès !'
            });
        })
        .catch(error => {
            res.status(500).json({
                error: error.message
            });
        });
};


exports.getallclient = (req, res, next) => {
    Client.find()
        .then(clients => {
            res.status(200).json(clients);
        })
        .catch(error => {
            res.status(500).json({
                error: error.message
            });
        });
};

exports.getoneClient = (req, res, next)=>{

    Client.findOne({_id:req.params.id})
          .then(data=>res.status(200).json(data))
          .catch(error=>res.status(500).json(error))
}

exports.loginClient = (req, res, next) => {

    if (!req.body) {
        return res.status(400).json({
            message: "Données manquantes"
        });
    }

    Client.findOne({ email: req.body.email })
        .then(client => {

            if (!client) {
                return res.status(401).json({
                    message: "Email incorrect"
                });
            }

            return bcrypt.compare(req.body.password, client.password)
                .then(valid => {

                    if (!valid) {
                        return res.status(401).json({
                            message: "Mot de passe incorrect"
                        });
                    }

                   const token = jwt.sign(
                       {clientId: client._id,},
                        'RANDOM_TOKEN_CLIENT',
                       { expiresIn: '24h' }
                       );

                    res.status(200).json({
                        clientId: client._id,
                        token: token,
                        name: client.name,
                        email: client.email,
                        telephone: client.telephone,
                        genre: client.genre
                    });

                });

        })
        .catch(error => {
            res.status(500).json({
                error: error.message
            });
        });
};


exports.deleteClient = (req, res, next) => {

    Client.findByIdAndDelete(req.params.id)
        .then(client => {

            if (!client) {
                return res.status(404).json({
                    message: "Client introuvable"
                });
            }

            res.status(200).json({
                message: "Client supprimé avec succès"
            });

        })
        .catch(error => {
            res.status(500).json({
                error: error.message
            });
        });
};