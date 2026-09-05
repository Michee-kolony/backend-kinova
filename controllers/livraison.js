const Livraison = require("../models/livraison");
const Commande = require("../models/commande");
const Livreur = require("../models/livreur");

// ==========================================
// METTRE À JOUR LA POSITION DU LIVREUR
// Appelé automatiquement par le frontend toutes les 5 secondes
// ==========================================

exports.mettreAJourPosition = async (req, res) => {
    try {
        const { numeroCommande, latitude, longitude } = req.body;

        if (!numeroCommande || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: "numeroCommande, latitude et longitude sont obligatoires"
            });
        }

        const commande = await Commande.findOne({ numeroCommande });

        if (!commande) {
            return res.status(404).json({
                success: false,
                message: "Commande introuvable"
            });
        }

        if (!commande.idLivreur || commande.idLivreur.toString() !== req.livreur.id) {
            return res.status(403).json({
                success: false,
                message: "Cette commande ne vous est pas assignée"
            });
        }

        const livreur = await Livreur.findById(req.livreur.id);

        if (!livreur) {
            return res.status(404).json({
                success: false,
                message: "Livreur introuvable"
            });
        }

        const livraison = await Livraison.findOneAndUpdate(
            { numeroCommande },
            {
                numeroCommande,
                idLivreur: livreur._id,
                nomLivreur: livreur.nom,
                photoLivreur: livreur.photo,
                telephoneLivreur: livreur.telephone,
                position: { latitude, longitude }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        const io = req.app.get("io");

        if (io) {
            const payload = {
                numeroCommande: livraison.numeroCommande,
                idLivreur: livraison.idLivreur,
                nomLivreur: livraison.nomLivreur,
                photoLivreur: livraison.photoLivreur,
                telephoneLivreur: livraison.telephoneLivreur,
                position: livraison.position
            };

            // Le client suit sa propre commande
            io.to(commande.utilisateurId.toString()).emit("positionLivreur", payload);

            // Le dashboard admin suit toutes les livraisons en cours
            io.to("admin-livreurs").emit("positionLivreurAdmin", payload);
        }

        return res.status(200).json({
            success: true,
            message: "Position mise à jour avec succès",
            livraison
        });

    } catch (error) {
        console.error("❌ Erreur mise à jour position livraison :", error);
        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la mise à jour de la position",
            error: error.message
        });
    }
};

// ==========================================
// ARRÊTER LE PARTAGE DE POSITION
// Le livreur ne partage plus sa position : on supprime l'enregistrement pour
// que plus personne (client, admin) ne reçoive de latitude/longitude pour
// cette commande.
// ==========================================

exports.arreterPartagePosition = async (req, res) => {
    try {
        const { numeroCommande } = req.params;

        const livraison = await Livraison.findOne({ numeroCommande });

        if (!livraison) {
            return res.status(200).json({
                success: true,
                message: "Aucun partage de position actif pour cette commande"
            });
        }

        if (livraison.idLivreur.toString() !== req.livreur.id) {
            return res.status(403).json({
                success: false,
                message: "Cette livraison ne vous est pas assignée"
            });
        }

        await Livraison.deleteOne({ numeroCommande });

        const commande = await Commande.findOne({ numeroCommande });
        const io = req.app.get("io");

        if (io) {
            const payload = { numeroCommande, position: null };

            if (commande) {
                io.to(commande.utilisateurId.toString()).emit("positionLivreur", payload);
            }

            io.to("admin-livreurs").emit("positionLivreurAdmin", payload);
        }

        return res.status(200).json({
            success: true,
            message: "Partage de position arrêté"
        });

    } catch (error) {
        console.error("❌ Erreur arrêt partage position :", error);
        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de l'arrêt du partage de position",
            error: error.message
        });
    }
};

// ==========================================
// RÉCUPÉRER LA POSITION ACTUELLE D'UNE LIVRAISON
// Utilisé par le client pour suivre sa commande
// ==========================================

exports.getPositionLivraison = async (req, res) => {
    try {
        const { numeroCommande } = req.params;

        const livraison = await Livraison.findOne({ numeroCommande });

        if (!livraison) {
            return res.status(404).json({
                success: false,
                message: "Aucune position disponible pour cette commande"
            });
        }

        return res.status(200).json({
            success: true,
            livraison
        });

    } catch (error) {
        console.error("❌ Erreur récupération position livraison :", error);
        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la récupération de la position",
            error: error.message
        });
    }
};

// ==========================================
// ADMIN : TOUTES LES LIVRAISONS EN COURS (avec position)
// Utilisé pour afficher les livreurs en cours de livraison sur la carte
// ==========================================

exports.getLivraisonsEnCours = async (req, res) => {
    try {
        const commandes = await Commande.find({
            statutLivraison: "EN_COURS_LIVRAISON",
            idLivreur: { $ne: null }
        }).select("numeroCommande idLivreur emailUtilisateur adresseLivraison");

        const numerosCommande = commandes.map((commande) => commande.numeroCommande);

        const livraisons = await Livraison.find({
            numeroCommande: { $in: numerosCommande }
        });

        const livraisonParNumero = {};
        livraisons.forEach((livraison) => {
            livraisonParNumero[livraison.numeroCommande] = livraison;
        });

        const resultat = commandes
            .map((commande) => {
                const livraison = livraisonParNumero[commande.numeroCommande];

                if (!livraison) {
                    return null;
                }

                return {
                    numeroCommande: commande.numeroCommande,
                    emailUtilisateur: commande.emailUtilisateur,
                    adresseLivraison: commande.adresseLivraison,
                    idLivreur: livraison.idLivreur,
                    nomLivreur: livraison.nomLivreur,
                    photoLivreur: livraison.photoLivreur,
                    telephoneLivreur: livraison.telephoneLivreur,
                    position: livraison.position,
                    derniereMiseAJour: livraison.updatedAt
                };
            })
            .filter(Boolean);

        return res.status(200).json({
            success: true,
            total: resultat.length,
            livraisons: resultat
        });

    } catch (error) {
        console.error("❌ Erreur récupération livraisons en cours :", error);
        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la récupération des livraisons en cours",
            error: error.message
        });
    }
};
