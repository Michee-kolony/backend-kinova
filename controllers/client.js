const Client = require('../models/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require("../config/mail");

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
                        adresse: client.adresse,
                        genre: client.genre,
                        date: client.date
                    });

                });

        })
        .catch(error => {
            res.status(500).json({
                error: error.message
            });
        });
};

exports.updateClient = async (req, res) => {

    try {

        const { clientId } = req.params;

        // Récupérer uniquement les champs autorisés
        const {
            name,
            email,
            telephone,
            genre
        } = req.body;

        const client = await Client.findById(clientId);

        if (!client) {

            return res.status(404).json({
                message: "Client introuvable."
            });

        }

        // Mise à jour des champs autorisés
        if (name !== undefined) client.name = name;
        if (email !== undefined) client.email = email;
        if (telephone !== undefined) client.telephone = telephone;
        if (genre !== undefined) client.genre = genre;

        const updatedClient = await client.save();

        res.status(200).json({

            message: "Compte mis à jour avec succès.",

            data: updatedClient

        });

    } catch (error) {

        res.status(500).json({

            message: "Erreur serveur.",

            error: error.message

        });

    }

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

//mes méthode de récupération Mot de passe
exports.sendResetCode = async (req, res) => {

    try {

        const { email } = req.body;

        const client = await Client.findOne({ email });

        if (!client) {

            return res.status(404).json({
                message: "Aucun compte trouvé."
            });

        }

        const code = Math.floor(1000 + Math.random() * 9000).toString();

        client.resetCode = code;

        client.resetCodeExpiration = Date.now() + 10 * 60 * 1000;

        await client.save();

        await transporter.sendMail({

            from: '"Kinova" <kinova@ayemtech.com>',

            to: client.email,

            subject: "Réinitialisation du mot de passe",

            html: `

            <div style="font-family:Arial">

            <h2>Kinova</h2>

            <p>Votre code est :</p>

            <h1 style="font-size:45px">${code}</h1>

            <p>Ce code expire dans 10 minutes.</p>

            </div>

            `

        });

        res.json({

            message: "Code envoyé."

        });

    }

    catch(error){

        res.status(500).json({

            error:error.message

        });

    }

}

exports.verifyResetCode = async (req,res)=>{

    try{

        const {email,code}=req.body;

        const client=await Client.findOne({email});

        if(!client){

            return res.status(404).json({

                message:"Compte introuvable"

            });

        }

        if(client.resetCode!==code){

            return res.status(400).json({

                message:"Code incorrect"

            });

        }

        if(client.resetCodeExpiration<Date.now()){

            return res.status(400).json({

                message:"Code expiré"

            });

        }

        res.json({

            message:"Code valide"

        });

    }

    catch(error){

        res.status(500).json({

            error:error.message

        });

    }

}

exports.resetPassword = async (req,res)=>{

try{

const {email,code,password}=req.body;

const client=await Client.findOne({email});

if(!client){

return res.status(404).json({

message:"Compte introuvable"

});

}

if(client.resetCode!==code){

return res.status(400).json({

message:"Code invalide"

});

}

if(client.resetCodeExpiration<Date.now()){

return res.status(400).json({

message:"Code expiré"

});

}

const hash=await bcrypt.hash(password,10);

client.password=hash;

client.resetCode=undefined;

client.resetCodeExpiration=undefined;

await client.save();

res.json({

message:"Mot de passe modifié."

});

}

catch(error){

res.status(500).json({

error:error.message

});

}

}