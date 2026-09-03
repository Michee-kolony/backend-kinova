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
            io.to(commande.utilisateurId.toString()).emit("positionLivreur", {
                numeroCommande: livraison.numeroCommande,
                idLivreur: livraison.idLivreur,
                nomLivreur: livraison.nomLivreur,
                photoLivreur: livraison.photoLivreur,
                telephoneLivreur: livraison.telephoneLivreur,
                position: livraison.position
            });
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
