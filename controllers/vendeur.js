const bcrypt = require("bcrypt");
const Vendeur = require("../models/vendeur");
const r2 = require("../config/r2");
const {DeleteObjectCommand} = require("@aws-sdk/client-s3");
const jwt = require('jsonwebtoken');



// ==========================================
// INSCRIPTION VENDEUR
// ==========================================

exports.inscrireVendeur = (req, res) => {

    const {
        email,
        password,
        confirmPassword,
        storeName,
        storeCategory,
        phoneNumber,
        address,
        paymentMethod,
        mobileMoneyNumber
    } = req.body;


    // ==========================================
    // 1. VÉRIFICATION DES CHAMPS
    // ==========================================

    if (!email ||!password || !confirmPassword || !storeName ||!storeCategory ||!phoneNumber ||!address ||!paymentMethod) {

        return res.status(400).json({
            success: false,
            message: "Veuillez remplir tous les champs obligatoires"
        });

    }


    // ==========================================
    // 2. VÉRIFICATION MOT DE PASSE
    // ==========================================

    if (password !== confirmPassword) {

        return res.status(400).json({
            success: false,
            message: "Les mots de passe ne correspondent pas"
        });

    }


    if (password.length < 6) {

        return res.status(400).json({
            success: false,
            message: "Le mot de passe doit contenir au moins 6 caractères"
        });

    }


    // ==========================================
    // 3. VÉRIFICATION PHOTO
    // ==========================================

    if (!req.file) {

        return res.status(400).json({
            success: false,
            message: "La photo de profil est obligatoire"
        });

    }


    // ==========================================
    // 4. VÉRIFICATION MODE DE PAIEMENT
    // ==========================================

    if (!["mobile_money", "card"].includes(paymentMethod)) {

        return res.status(400).json({
            success: false,
            message: "Mode de paiement invalide"
        });

    }


    // ==========================================
    // 5. VÉRIFICATION MOBILE MONEY
    // ==========================================

    if (
        paymentMethod === "mobile_money" &&
        !mobileMoneyNumber
    ) {

        return res.status(400).json({
            success: false,
            message: "Le numéro Mobile Money est obligatoire"
        });

    }


    // ==========================================
    // 6. VÉRIFIER SI EMAIL EXISTE
    // ==========================================

    Vendeur.findOne({
        email: email.toLowerCase().trim()
    })

    .then((vendeurExiste) => {

        if (vendeurExiste) {

            return res.status(409).json({
                success: false,
                message: "Cette adresse e-mail est déjà utilisée"
            });

        }


        // ==========================================
        // 7. HASH PASSWORD
        // ==========================================

        return bcrypt.hash(password, 10);

    })

    .then((hashedPassword) => {

        // ==========================================
        // 8. URL PHOTO R2
        // ==========================================

        const profilePhoto = req.file.location;


        // ==========================================
        // 9. CRÉATION VENDEUR
        // ==========================================

        const vendeur = new Vendeur({

            email: email.toLowerCase().trim(),

            password: hashedPassword,

            storeName: storeName.trim(),

            storeCategory: storeCategory.trim(),

            profilePhoto: profilePhoto,

            phoneNumber: phoneNumber.trim(),

            address: address.trim(),

            paymentMethod: paymentMethod,

            mobileMoneyNumber:
                paymentMethod === "mobile_money"
                    ? mobileMoneyNumber.trim()
                    : null,

            status: "pending",

            isVerified: false

        });


        // ==========================================
        // 10. SAUVEGARDE
        // ==========================================

        return vendeur.save();

    })

    .then((vendeur) => {

        // ==========================================
        // 11. RÉPONSE
        // ==========================================

        return res.status(201).json({

            success: true,

            message: "Votre compte vendeur a été créé avec succès",

            vendeur: {

                id: vendeur._id,

                email: vendeur.email,

                storeName: vendeur.storeName,

                storeCategory: vendeur.storeCategory,

                profilePhoto: vendeur.profilePhoto,

                phoneNumber: vendeur.phoneNumber,

                address: vendeur.address,

                paymentMethod: vendeur.paymentMethod,

                status: vendeur.status,

                isVerified: vendeur.isVerified

            }

        });

    })

    .catch((error) => {

        console.error(
            "Erreur inscription vendeur :",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Une erreur est survenue lors de la création du compte vendeur",

            error: error.message

        });

    });

};

// ==========================================
// CONNEXION VENDEUR
// ==========================================

exports.loginVendeur = (req, res) => {

    const {
        email,
        password
    } = req.body;


    // ==========================================
    // 1. VÉRIFICATION DES CHAMPS
    // ==========================================

    if (!email || !password) {

        return res.status(400).json({

            success: false,

            message:
                "L'adresse e-mail et le mot de passe sont obligatoires"

        });

    }


    // ==========================================
    // 2. RECHERCHE DU VENDEUR
    // ==========================================

    Vendeur.findOne({

        email: email.toLowerCase().trim()

    })

    .then((vendeur) => {


        // ==========================================
        // 3. VENDEUR INTROUVABLE
        // ==========================================

        if (!vendeur) {

            return res.status(401).json({

                success: false,

                message:
                    "Adresse e-mail ou mot de passe incorrect"

            });

        }


        // ==========================================
        // 4. VÉRIFICATION DU STATUT
        // ==========================================

        if (vendeur.status === "blocked") {

            return res.status(403).json({

                success: false,

                message:
                    "Votre compte vendeur a été bloqué"

            });

        }


        if (vendeur.status === "suspended") {

            return res.status(403).json({

                success: false,

                message:
                    "Votre compte vendeur est temporairement suspendu"

            });

        }


        // ==========================================
        // 5. VÉRIFICATION DU MOT DE PASSE
        // ==========================================

        return bcrypt.compare(
            password,
            vendeur.password
        )

        .then((passwordCorrect) => {

            if (!passwordCorrect) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Adresse e-mail ou mot de passe incorrect"

                });

            }


            // ==========================================
            // 6. GÉNÉRATION DU TOKEN JWT
            // ==========================================

            const token = jwt.sign(

                {
                    vendeurId: vendeur._id,
                    email: vendeur.email,
                    role: "vendeur"
                },

                "Kinova_Vendeur_JWT_Secret_2026_9fK3mP7xQ2vL8zN5",

                {
                    expiresIn: "7d"
                }

            );


            // ==========================================
            // 7. RÉPONSE
            // ==========================================

            return res.status(200).json({

                success: true,

                message:
                    "Connexion vendeur réussie",

                token: token,

                vendeur: {

                    id: vendeur._id,

                    email: vendeur.email,

                    storeName:
                        vendeur.storeName,

                    storeCategory:
                        vendeur.storeCategory,

                    profilePhoto:
                        vendeur.profilePhoto,

                    phoneNumber:
                        vendeur.phoneNumber,

                    address:
                        vendeur.address,

                    paymentMethod:
                        vendeur.paymentMethod,

                    mobileMoneyNumber:
                        vendeur.mobileMoneyNumber,

                    status:
                        vendeur.status,

                    isVerified:
                        vendeur.isVerified,

                    createdAt:
                        vendeur.createdAt,

                    updatedAt:
                        vendeur.updatedAt

                }

            });

        });

    })


    // ==========================================
    // 8. GESTION DES ERREURS
    // ==========================================

    .catch((error) => {

        console.error(
            "Erreur connexion vendeur :",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Une erreur est survenue lors de la connexion",

            error:
                error.message

        });

    });

};

exports.getVendeur = (req, res) => {

    Vendeur.find()
           .then((vendeurs) => {res.status(200).json(vendeurs);})
           .catch((error) => {res.status(500).json({success: false, message: "Erreur lors de la récupération des vendeurs", error: error.message});});

};

// ==========================================
// SUPPRIMER UN VENDEUR ET SA PHOTO R2
// ==========================================

exports.supprimerVendeur = (req, res) => {

    const vendeurId = req.params.id;


    // ==========================================
    // 1. RECHERCHER LE VENDEUR
    // ==========================================

    Vendeur.findById(vendeurId)

        .then((vendeur) => {

            // ==========================================
            // VENDEUR INTROUVABLE
            // ==========================================

            if (!vendeur) {

                return res.status(404).json({

                    success: false,

                    message: "Vendeur introuvable"

                });

            }


            // ==========================================
            // 2. RÉCUPÉRER LA PHOTO
            // ==========================================

            const profilePhoto = vendeur.profilePhoto;


            // ==========================================
            // 3. RÉCUPÉRER LA CLÉ DU FICHIER R2
            // ==========================================

            let r2Key = null;

            if (profilePhoto) {

                try {

                    const url = new URL(profilePhoto);

                    r2Key = decodeURIComponent(
                        url.pathname.substring(1)
                    );

                } catch (error) {

                    console.error(
                        "Impossible de récupérer la clé R2 :",
                        error
                    );

                }

            }


            // ==========================================
            // 4. SUPPRIMER LA PHOTO R2
            // ==========================================

            if (r2Key) {

                return r2.send(

                    new DeleteObjectCommand({

                        Bucket: "kinova",

                        Key: r2Key

                    })

                )

                .then(() => {

                    console.log(
                        "Photo vendeur supprimée de R2 :",
                        r2Key
                    );


                    // ==========================================
                    // 5. SUPPRIMER LE VENDEUR MONGODB
                    // ==========================================

                    return Vendeur.findByIdAndDelete(
                        vendeurId
                    );

                });

            }


            // ==========================================
            // SI AUCUNE PHOTO R2
            // ==========================================

            return Vendeur.findByIdAndDelete(
                vendeurId
            );

        })


        // ==========================================
        // 6. RÉPONSE
        // ==========================================

        .then((vendeurSupprime) => {

            if (!vendeurSupprime) {

                return;

            }


            return res.status(200).json({

                success: true,

                message:
                    "Le vendeur et sa photo ont été supprimés avec succès",

                vendeurId: vendeurSupprime._id

            });

        })


        // ==========================================
        // 7. GESTION DES ERREURS
        // ==========================================

        .catch((error) => {

            console.error(
                "Erreur lors de la suppression du vendeur :",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Une erreur est survenue lors de la suppression du vendeur",

                error: error.message

            });

        });

};