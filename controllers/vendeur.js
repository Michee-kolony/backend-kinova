const bcrypt = require("bcrypt");
const Vendeur = require("../models/vendeur");
const r2 = require("../config/r2");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const jwt = require('jsonwebtoken');

// URL publique de votre bucket R2
const R2_PUBLIC_URL = 'https://pub-20adc7d32978483dafa25eec6f011365.r2.dev';

// ==========================================
// INSCRIPTION VENDEUR (CORRIGÉE)
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

        if (paymentMethod === "mobile_money" && !mobileMoneyNumber) {
            return res.status(400).json({
                success: false,
                message: "Le numéro Mobile Money est obligatoire"
            });
        }

        // ==========================================
        // 6. VÉRIFIER SI EMAIL EXISTE
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
        // 7. VÉRIFIER SI STORE NAME EXISTE (insensible à la casse)
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
        // 8. HASH PASSWORD
        // ==========================================

        const hashedPassword = await bcrypt.hash(password, 10);

        // ==========================================
        // 9. URL PHOTO
        // ==========================================

        const profilePhoto = `${R2_PUBLIC_URL}/${req.file.key}`;
        console.log('URL photo générée:', profilePhoto);

        // ==========================================
        // 10. CRÉATION VENDEUR
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
            mobileMoneyNumber: paymentMethod === "mobile_money" ? mobileMoneyNumber.trim() : null,
            status: "pending",
            isVerified: false
        });

        // ==========================================
        // 11. SAUVEGARDE
        // ==========================================

        await vendeur.save();

        // ==========================================
        // 12. RÉPONSE SUCCÈS
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

    } catch (error) {
        console.error("❌ Erreur inscription vendeur :", error);

        // ==========================================
        // GESTION DES ERREURS MONGOOSE
        // ==========================================

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
// MISE À JOUR PHOTO DE PROFIL
// ==========================================

exports.updateProfilePhoto = async (req, res) => {
    try {
        const vendeurId = req.params.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Aucune photo fournie"
            });
        }

        const vendeur = await Vendeur.findById(vendeurId);
        
        if (!vendeur) {
            return res.status(404).json({
                success: false,
                message: "Vendeur non trouvé"
            });
        }

        if (vendeur.profilePhoto) {
            try {
                const oldKey = vendeur.profilePhoto.split('/').pop();
                if (oldKey) {
                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: 'kinova',
                        Key: oldKey
                    });
                    await r2.send(deleteCommand);
                    console.log('Ancienne photo supprimée:', oldKey);
                }
            } catch (deleteError) {
                console.warn('Erreur suppression ancienne photo:', deleteError);
            }
        }

        const newProfilePhoto = `${R2_PUBLIC_URL}/${req.file.key}`;
        vendeur.profilePhoto = newProfilePhoto;
        vendeur.updatedAt = new Date().toISOString();
        await vendeur.save();

        return res.status(200).json({
            success: true,
            message: "Photo de profil mise à jour avec succès",
            profilePhoto: newProfilePhoto,
            vendeur: {
                id: vendeur._id,
                email: vendeur.email,
                storeName: vendeur.storeName,
                profilePhoto: vendeur.profilePhoto
            }
        });

    } catch (error) {
        console.error('❌ Erreur mise à jour photo:', error);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour de la photo",
            error: error.message
        });
    }
};

// ==========================================
// MISE À JOUR DU PROFIL VENDEUR
// ==========================================

exports.updateVendeurProfile = async (req, res) => {
    try {
        const vendeurId = req.params.id;
        const updates = req.body;

        const allowedUpdates = [
            'storeName',
            'storeCategory',
            'phoneNumber',
            'address',
            'paymentMethod',
            'mobileMoneyNumber'
        ];

        const updateData = {};
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateData[key] = updates[key];
            }
        });

        updateData.updatedAt = new Date().toISOString();

        const vendeur = await Vendeur.findByIdAndUpdate(
            vendeurId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!vendeur) {
            return res.status(404).json({
                success: false,
                message: "Vendeur non trouvé"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profil mis à jour avec succès",
            vendeur
        });

    } catch (error) {
        console.error('❌ Erreur mise à jour profil:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Ce nom de boutique est déjà utilisé"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour du profil",
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
                        profilePhoto: vendeur.profilePhoto,
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
// SUPPRIMER UN VENDEUR ET SA PHOTO R2
// ==========================================

exports.supprimerVendeur = (req, res) => {
    const vendeurId = req.params.id;

    Vendeur.findById(vendeurId)
        .then((vendeur) => {
            if (!vendeur) {
                return res.status(404).json({
                    success: false,
                    message: "Vendeur introuvable"
                });
            }

            const profilePhoto = vendeur.profilePhoto;
            let r2Key = null;

            if (profilePhoto) {
                try {
                    const url = new URL(profilePhoto);
                    r2Key = decodeURIComponent(url.pathname.substring(1));
                } catch (error) {
                    console.error("Impossible de récupérer la clé R2:", error);
                }
            }

            if (r2Key) {
                return r2.send(
                    new DeleteObjectCommand({
                        Bucket: "kinova",
                        Key: r2Key
                    })
                )
                .then(() => {
                    console.log("Photo vendeur supprimée de R2:", r2Key);
                    return Vendeur.findByIdAndDelete(vendeurId);
                });
            }

            return Vendeur.findByIdAndDelete(vendeurId);
        })
        .then((vendeurSupprime) => {
            if (!vendeurSupprime) return;

            return res.status(200).json({
                success: true,
                message: "Le vendeur et sa photo ont été supprimés avec succès",
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