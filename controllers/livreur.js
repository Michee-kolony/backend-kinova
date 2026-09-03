const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Livreur = require("../models/livreur");
const r2 = require("../config/r2");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

// ==========================================
// INSCRIRE UN LIVREUR
// ==========================================

exports.inscrireLivreur = async (req, res) => {
    try {
        const { nom, email, password, telephone } = req.body;

        if (!nom || !email || !password || !telephone) {
            return res.status(400).json({
                success: false,
                message: "Veuillez remplir tous les champs obligatoires"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "La photo du livreur est obligatoire"
            });
        }

        const emailExists = await Livreur.findOne({
            email: email.toLowerCase().trim()
        });

        if (emailExists) {
            return res.status(409).json({
                success: false,
                message: "Cette adresse e-mail est déjà utilisée"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const photo = `https://pub-20adc7d32978483dafa25eec6f011365.r2.dev/${req.file.key}`;

        const livreur = new Livreur({
            nom: nom.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            telephone: telephone.trim(),
            photo
        });

        await livreur.save();

        return res.status(201).json({
            success: true,
            message: "Le livreur a été créé avec succès",
            livreur: {
                id: livreur._id,
                nom: livreur.nom,
                email: livreur.email,
                telephone: livreur.telephone,
                photo: livreur.photo,
                dateInscription: livreur.dateInscription
            }
        });

    } catch (error) {
        console.error("❌ Erreur inscription livreur :", error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join('. ')
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Cette adresse e-mail est déjà utilisée"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la création du livreur",
            error: error.message
        });
    }
};

// ==========================================
// CONNEXION LIVREUR
// ==========================================

exports.loginLivreur = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "L'adresse e-mail et le mot de passe sont obligatoires"
        });
    }

    Livreur.findOne({ email: email.toLowerCase().trim() })
        .then((livreur) => {
            if (!livreur) {
                return res.status(401).json({
                    success: false,
                    message: "Adresse e-mail ou mot de passe incorrect"
                });
            }

            return bcrypt.compare(password, livreur.password)
                .then((passwordCorrect) => {
                    if (!passwordCorrect) {
                        return res.status(401).json({
                            success: false,
                            message: "Adresse e-mail ou mot de passe incorrect"
                        });
                    }

                    const token = jwt.sign(
                        {
                            livreurId: livreur._id,
                            email: livreur.email,
                            role: "livreur"
                        },
                        process.env.TOKEN_SECRET || "RANDOM_TOKEN_ADMIN",
                        { expiresIn: "7d" }
                    );

                    return res.status(200).json({
                        success: true,
                        message: "Connexion livreur réussie",
                        token,
                        livreur: {
                            id: livreur._id,
                            nom: livreur.nom,
                            email: livreur.email,
                            telephone: livreur.telephone,
                            photo: livreur.photo,
                            dateInscription: livreur.dateInscription
                        }
                    });
                });
        })
        .catch((error) => {
            console.error("❌ Erreur connexion livreur :", error);
            return res.status(500).json({
                success: false,
                message: "Une erreur est survenue lors de la connexion",
                error: error.message
            });
        });
};

// ==========================================
// RÉCUPÉRER TOUS LES LIVREURS
// ==========================================

exports.getAllLivreur = (req, res) => {
    Livreur.find()
        .then((livreurs) => res.status(200).json(livreurs))
        .catch((error) => {
            console.error("❌ Erreur récupération livreurs :", error);
            res.status(500).json({
                success: false,
                message: "Erreur lors de la récupération des livreurs",
                error: error.message
            });
        });
};

// ==========================================
// RÉCUPÉRER UN LIVREUR PAR ID
// ==========================================

exports.getOneLivreur = (req, res) => {
    Livreur.findOne({ _id: req.params.id })
        .then((livreur) => {
            if (!livreur) {
                return res.status(404).json({
                    success: false,
                    message: "Livreur introuvable"
                });
            }
            return res.status(200).json(livreur);
        })
        .catch((error) => res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du livreur",
            error: error.message
        }));
};

// ==========================================
// SUPPRIMER UN LIVREUR (+ PHOTO SUR R2)
// ==========================================

exports.deleteLivreur = async (req, res) => {
    try {
        const livreur = await Livreur.findById(req.params.id);

        if (!livreur) {
            return res.status(404).json({
                success: false,
                message: "Livreur introuvable"
            });
        }

        if (livreur.photo) {
            const key = livreur.photo.split(".r2.dev/")[1];

            if (key) {
                await r2.send(
                    new DeleteObjectCommand({
                        Bucket: "kinova",
                        Key: key
                    })
                );
            }
        }

        await Livreur.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Le livreur a été supprimé avec succès",
            livreurId: livreur._id
        });

    } catch (error) {
        console.error("❌ Erreur suppression livreur :", error);
        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la suppression du livreur",
            error: error.message
        });
    }
};
