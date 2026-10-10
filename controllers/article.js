const Article = require("../models/article");
const { uploadImages, deleteImages } = require("../services/r2Images");

exports.createArticle = async (req, res) => {

    let images = [];

    try {

        images = await uploadImages(req.files, "articles");

        const article = new Article({
            nom: req.body.nom,
            prix: req.body.prix,
            reduction: req.body.reduction,
            categorie: req.body.categorie,
            genre: req.body.genre,
            description: req.body.description,

            // Nouveaux champs
            stock: req.body.stock,
            couleurs: Array.isArray(req.body.couleurs)
                ? req.body.couleurs
                : JSON.parse(req.body.couleurs || "[]"),
            tailles: Array.isArray(req.body.tailles)
                ? req.body.tailles
                : JSON.parse(req.body.tailles || "[]"),

            images,
            vendeurId: req.body.vendeurId,
            vendeurNom: req.body.vendeurNom,
            vendeurTelephone: req.body.vendeurTelephone
        });

        await article.save();

        res.status(201).json(article);

    } catch (err) {
        console.log(err);

        // L'article n'a pas été créé : on retire ses images du bucket
        await deleteImages(images);

        res.status(err.status || 500).json({
            message: err.message
        });
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

        if(!article){
            return res.status(404).json({
                message:"Article introuvable"
            });
        }


        await deleteImages(article.images);


        await Article.findByIdAndDelete(req.params.id);


        res.status(200).json({
            message:"Article supprimé avec images"
        });


    } catch(error){

        console.log(error);

        res.status(500).json({
            message:error.message
        });

    }

};

exports.updateArticle = async (req, res) => {

    let nouvellesImages = [];

    try {

        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                message: "Article introuvable"
            });
        }

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

        // Nouveaux champs
        if (req.body.stock !== undefined)
            article.stock = req.body.stock;

        if (req.body.couleurs !== undefined)
            article.couleurs = Array.isArray(req.body.couleurs)
                ? req.body.couleurs
                : JSON.parse(req.body.couleurs);

        if (req.body.tailles !== undefined)
            article.tailles = Array.isArray(req.body.tailles)
                ? req.body.tailles
                : JSON.parse(req.body.tailles);

        if (req.body.vendeurId !== undefined)
            article.vendeurId = req.body.vendeurId;

        if (req.body.vendeurNom !== undefined)
            article.vendeurNom = req.body.vendeurNom;

        if (req.body.vendeurTelephone !== undefined)
            article.vendeurTelephone = req.body.vendeurTelephone;

        // Nouvelles images : elles remplacent les anciennes
        let anciennesImages = [];

        if (req.files && req.files.length > 0) {
            nouvellesImages = await uploadImages(req.files, "articles");
            anciennesImages = article.images;
            article.images = nouvellesImages;
        }

        await article.save();

        // Les anciennes images ne sont plus utilisées : on les retire du bucket
        await deleteImages(anciennesImages);

        res.status(200).json({
            message: "Article modifié avec succès",
            article
        });

    } catch (error) {

        console.log(error);

        await deleteImages(nouvellesImages);

        res.status(error.status || 500).json({
            message: error.message
        });

    }

};
