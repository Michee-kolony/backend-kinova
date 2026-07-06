const Article = require("../models/article");
const r2 = require("../config/r2");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

exports.createArticle = async (req, res) => {
    try {

        const images = req.files.map(file => {
            return `https://pub-20adc7d32978483dafa25eec6f011365.r2.dev/${file.key}`;
        });

        const article = new Article({
            nom: req.body.nom,
            prix: req.body.prix,
            reduction: req.body.reduction,
            categorie: req.body.categorie,
            genre: req.body.genre,
            description: req.body.description,
            images,
            vendeurId: req.body.vendeurId,
            vendeurNom: req.body.vendeurNom,
            vendeurTelephone: req.body.vendeurTelephone
        });

        await article.save();

        res.status(201).json(article);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
};

exports.getArticle = (req, res, next) => {
    Article.find()
        .then(data => res.status(200).json(data))
        .catch(error => res.status(500).json(error));
};


exports.getOneArticle = (req, res, next)=>{
    Article.findOne({_id: req.params.id})
           .then(data => res.status(200).json(data))
           .catch(error => res.status(500).json(error));
}

exports.deleteArticle = async (req, res) => {
    try {

        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ message: "Article introuvable" });
        }

        // supprimer toutes les images dans R2
        if (article.images && article.images.length > 0) {
            await Promise.all(
                article.images.map(async (imageUrl) => {

                    // extraction du key depuis ton URL publique
                    const key = imageUrl.split(".r2.dev/")[1];

                    if (key) {
                        await r2.send(
                            new DeleteObjectCommand({
                                Bucket: 'kinova', // ou mets le nom direct si tu veux
                                Key: key,
                            })
                        );
                    }
                })
            );
        }

        // 🗑️ supprimer l'article en base
        await Article.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Article supprimé avec succès"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
};


exports.updateArticle = (req, res) => {

    Article.findById(req.params.id)

        .then(article => {

            if (!article) {
                return res.status(404).json({
                    message: "Article introuvable"
                });
            }

            // Mise à jour uniquement des champs reçus
            if (req.body.nom !== undefined)
                article.nom = req.body.nom;

            if (req.body.prix !== undefined)
                article.prix = req.body.prix;

            if (req.body.reduction !== undefined)
                article.reduction = req.body.reduction;

            if (req.body.categorie !== undefined)
                article.categorie = req.body.categorie;

            if (req.body.genre !== undefined)
                article.genre = req.body.genre;

            if (req.body.description !== undefined)
                article.description = req.body.description;

            if (req.body.vendeurId !== undefined)
                article.vendeurId = req.body.vendeurId;

            if (req.body.vendeurNom !== undefined)
                article.vendeurNom = req.body.vendeurNom;

            if (req.body.vendeurTelephone !== undefined)
                article.vendeurTelephone = req.body.vendeurTelephone;

            // Nouvelles images
            if (req.files && req.files.length > 0) {
                article.images = req.files.map(file =>
                    `https://pub-20adc7d32978483dafa25eec6f011365.r2.dev/${file.key}`
                );
            }

            // Déclenche le middleware pre('save')
            return article.save();

        })

        .then(article => {

            if (!article) return;

            res.status(200).json({
                message: "Article modifié avec succès",
                article
            });

        })

        .catch(error => {

            console.log(error);

            res.status(500).json({
                message: error.message
            });

        });

};