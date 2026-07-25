const bcrypt = require("bcrypt");
const Vendeur = require("../models/vendeur");
const jwt = require('jsonwebtoken');

// ==========================================
// INSCRIPTION VENDEUR (SANS PHOTO)
// ==========================================

exports.inscrireVendeur = async (req, res) => {
    try {
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

        if (!email || !password || !confirmPassword || !storeName || !storeCategory || !phoneNumber || !address || !paymentMethod) {
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
        // 3. VÉRIFICATION MODE DE PAIEMENT
        // ==========================================

        if (!["mobile_money", "card"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Mode de paiement invalide"
            });
        }

        // ==========================================
        // 4. VÉRIFICATION MOBILE MONEY
        // ==========================================

        if (paymentMethod === "mobile_money" && !mobileMoneyNumber) {
            return res.status(400).json({
                success: false,
                message: "Le numéro Mobile Money est obligatoire"
            });
        }

        // ==========================================
        // 5. VÉRIFIER SI EMAIL EXISTE
        // ==========================================

        const emailExists = await Vendeur.findOne({
            email: email.toLowerCase().trim()
        });

        if (emailExists) {
            return res.status(409).json({
                success: false,
                message: "Cette adresse e-mail est déjà utilisée"
            });
        }

        // ==========================================
        // 6. VÉRIFIER SI STORE NAME EXISTE
        // ==========================================

        const storeNameExists = await Vendeur.findOne({
            storeName: { $regex: new RegExp(`^${storeName.trim()}$`, 'i') }
        });

        if (storeNameExists) {
            return res.status(409).json({
                success: false,
                message: "Ce nom de boutique est déjà utilisé"
            });
        }

        // ==========================================
        // 7. HASH PASSWORD
        // ==========================================

        const hashedPassword = await bcrypt.hash(password, 10);

        // ==========================================
        // 8. CRÉATION VENDEUR (SANS PHOTO)
        // ==========================================

        const vendeur = new Vendeur({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            storeName: storeName.trim(),
            storeCategory: storeCategory.trim(),
            phoneNumber: phoneNumber.trim(),
            address: address.trim(),
            paymentMethod: paymentMethod,
            mobileMoneyNumber: paymentMethod === "mobile_money" ? mobileMoneyNumber.trim() : null,
            status: "pending",
            isVerified: false
        });

        // ==========================================
        // 9. SAUVEGARDE
        // ==========================================

        await vendeur.save();

        // ==========================================
        // 10. RÉPONSE SUCCÈS
        // ==========================================

        return res.status(201).json({
            success: true,
            message: "Votre compte vendeur a été créé avec succès",
            vendeur: {
                id: vendeur._id,
                email: vendeur.email,
                storeName: vendeur.storeName,
                storeCategory: vendeur.storeCategory,
                phoneNumber: vendeur.phoneNumber,
                address: vendeur.address,
                paymentMethod: vendeur.paymentMethod,
                status: vendeur.status,
                isVerified: vendeur.isVerified,
                createdAt: vendeur.createdAt,
                updatedAt: vendeur.updatedAt
            }
        });

    } catch (error) {
        console.error("❌ Erreur inscription vendeur :", error);

        // Erreur de validation Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join('. ')
            });
        }

        // Erreur de duplication (index unique)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            let message = 'Une valeur unique est déjà utilisée';
            
            if (field === 'email') {
                message = 'Cette adresse e-mail est déjà utilisée';
            } else if (field === 'storeName') {
                message = 'Ce nom de boutique est déjà utilisé';
            }
            
            return res.status(409).json({
                success: false,
                message: message
            });
        }

        // Erreur générique
        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la création du compte vendeur",
            error: error.message
        });
    }
};

// ==========================================
// MODIFIER UN VENDEUR
// ==========================================

exports.modifierVendeur = async (req, res) => {
    try {
        const vendeurId = req.params.id;
        const updates = req.body;

        // ==========================================
        // 1. VÉRIFICATION DES CHAMPS AUTORISÉS
        // ==========================================

        const allowedUpdates = [
            'storeName',
            'storeCategory',
            'phoneNumber',
            'address',
            'paymentMethod',
            'mobileMoneyNumber',
            'status',
            'isVerified'
        ];

        const isValidOperation = Object.keys(updates).every(key => 
            allowedUpdates.includes(key)
        );

        if (!isValidOperation) {
            return res.status(400).json({
                success: false,
                message: "Mise à jour invalide. Certains champs ne sont pas autorisés."
            });
        }

        // ==========================================
        // 2. VÉRIFIER SI LE VENDEUR EXISTE
        // ==========================================

        const vendeur = await Vendeur.findById(vendeurId);
        
        if (!vendeur) {
            return res.status(404).json({
                success: false,
                message: "Vendeur introuvable"
            });
        }

        // ==========================================
        // 3. VÉRIFICATIONS SPÉCIFIQUES
        // ==========================================

        // Vérifier si le storeName est modifié et n'existe pas déjà
        if (updates.storeName && updates.storeName !== vendeur.storeName) {
            const storeNameExists = await Vendeur.findOne({
                _id: { $ne: vendeurId },
                storeName: { $regex: new RegExp(`^${updates.storeName.trim()}$`, 'i') }
            });

            if (storeNameExists) {
                return res.status(409).json({
                    success: false,
                    message: "Ce nom de boutique est déjà utilisé par un autre vendeur"
                });
            }
        }

        // Vérifier si l'email est modifié (si vous autorisez la modification d'email)
        if (updates.email && updates.email !== vendeur.email) {
            const emailExists = await Vendeur.findOne({
                _id: { $ne: vendeurId },
                email: updates.email.toLowerCase().trim()
            });

            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: "Cette adresse e-mail est déjà utilisée par un autre vendeur"
                });
            }
        }

        // Vérifier le mode de paiement
        if (updates.paymentMethod && !["mobile_money", "card"].includes(updates.paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Mode de paiement invalide"
            });
        }

        // Vérifier le numéro Mobile Money
        if (updates.paymentMethod === "mobile_money" && !updates.mobileMoneyNumber) {
            return res.status(400).json({
                success: false,
                message: "Le numéro Mobile Money est obligatoire pour ce mode de paiement"
            });
        }

        // ==========================================
        // 4. APPLICATION DES MODIFICATIONS
        // ==========================================

        // Appliquer les mises à jour
        Object.keys(updates).forEach(key => {
            if (key === 'email') {
                vendeur[key] = updates[key].toLowerCase().trim();
            } else if (key === 'storeName' || key === 'storeCategory' || key === 'phoneNumber' || key === 'address') {
                vendeur[key] = updates[key].trim();
            } else if (key === 'mobileMoneyNumber') {
                vendeur[key] = updates[key] ? updates[key].trim() : null;
            } else {
                vendeur[key] = updates[key];
            }
        });

        // Mettre à jour la date de modification
        vendeur.updatedAt = new Date();

        // ==========================================
        // 5. SAUVEGARDE
        // ==========================================

        await vendeur.save();

        // ==========================================
        // 6. RÉPONSE SUCCÈS
        // ==========================================

        return res.status(200).json({
            success: true,
            message: "Vendeur modifié avec succès",
            vendeur: {
                id: vendeur._id,
                email: vendeur.email,
                storeName: vendeur.storeName,
                storeCategory: vendeur.storeCategory,
                phoneNumber: vendeur.phoneNumber,
                address: vendeur.address,
                paymentMethod: vendeur.paymentMethod,
                mobileMoneyNumber: vendeur.mobileMoneyNumber,
                status: vendeur.status,
                isVerified: vendeur.isVerified,
                createdAt: vendeur.createdAt,
                updatedAt: vendeur.updatedAt
            }
        });

    } catch (error) {
        console.error("❌ Erreur modification vendeur :", error);

        // Erreur de validation Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join('. ')
            });
        }

        // Erreur de duplication (index unique)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            let message = 'Une valeur unique est déjà utilisée';
            
            if (field === 'email') {
                message = 'Cette adresse e-mail est déjà utilisée';
            } else if (field === 'storeName') {
                message = 'Ce nom de boutique est déjà utilisé';
            }
            
            return res.status(409).json({
                success: false,
                message: message
            });
        }

        // Erreur générique
        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la modification du vendeur",
            error: error.message
        });
    }
};

// ==========================================
// CONNEXION VENDEUR
// ==========================================

exports.loginVendeur = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "L'adresse e-mail et le mot de passe sont obligatoires"
        });
    }

    Vendeur.findOne({
        email: email.toLowerCase().trim()
    })
    .then((vendeur) => {
        if (!vendeur) {
            return res.status(401).json({
                success: false,
                message: "Adresse e-mail ou mot de passe incorrect"
            });
        }

        if (vendeur.status === "blocked") {
            return res.status(403).json({
                success: false,
                message: "Votre compte vendeur a été bloqué"
            });
        }

        if (vendeur.status === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Votre compte vendeur est temporairement suspendu"
            });
        }

        return bcrypt.compare(password, vendeur.password)
            .then((passwordCorrect) => {
                if (!passwordCorrect) {
                    return res.status(401).json({
                        success: false,
                        message: "Adresse e-mail ou mot de passe incorrect"
                    });
                }

                const token = jwt.sign(
                    {
                        vendeurId: vendeur._id,
                        email: vendeur.email,
                        role: "vendeur"
                    },
                    "Kinova_Vendeur_JWT_Secret_2026_9fK3mP7xQ2vL8zN5",
                    { expiresIn: "7d" }
                );

                return res.status(200).json({
                    success: true,
                    message: "Connexion vendeur réussie",
                    token: token,
                    vendeur: {
                        id: vendeur._id,
                        email: vendeur.email,
                        storeName: vendeur.storeName,
                        storeCategory: vendeur.storeCategory,
                        phoneNumber: vendeur.phoneNumber,
                        address: vendeur.address,
                        paymentMethod: vendeur.paymentMethod,
                        mobileMoneyNumber: vendeur.mobileMoneyNumber,
                        status: vendeur.status,
                        isVerified: vendeur.isVerified,
                        createdAt: vendeur.createdAt,
                        updatedAt: vendeur.updatedAt
                    }
                });
            });
    })
    .catch((error) => {
        console.error("❌ Erreur connexion vendeur :", error);
        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la connexion",
            error: error.message
        });
    });
};

// ==========================================
// RÉCUPÉRER TOUS LES VENDEURS
// ==========================================

exports.getVendeur = (req, res) => {
    Vendeur.find()
        .then((vendeurs) => {
            return res.status(200).json(vendeurs);
        })
        .catch((error) => {
            console.error("❌ Erreur récupération vendeurs:", error);
            return res.status(500).json({
                success: false,
                message: "Erreur lors de la récupération des vendeurs",
                error: error.message
            });
        });
};

// ==========================================
// SUPPRIMER UN VENDEUR
// ==========================================

exports.supprimerVendeur = (req, res) => {
    const vendeurId = req.params.id;

    Vendeur.findByIdAndDelete(vendeurId)
        .then((vendeurSupprime) => {
            if (!vendeurSupprime) {
                return res.status(404).json({
                    success: false,
                    message: "Vendeur introuvable"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Le vendeur a été supprimé avec succès",
                vendeurId: vendeurSupprime._id
            });
        })
        .catch((error) => {
            console.error("❌ Erreur suppression vendeur:", error);
            return res.status(500).json({
                success: false,
                message: "Une erreur est survenue lors de la suppression du vendeur",
                error: error.message
            });
        });
};