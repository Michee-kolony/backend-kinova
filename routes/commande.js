const express = require("express");

const router = express.Router();

const {
    creerCommande,
    getCommandesUtilisateur,
    getCommandeById,
    updateStatutCommande,
    verifierPaiement
} = require("../controllers/commande");


// Créer une commande
router.post("/", creerCommande);


router.get('/verifier-paiement/:id', verifierPaiement);



// Récupérer toutes les commandes d'un utilisateur
router.get("/utilisateur/:utilisateurId", getCommandesUtilisateur);
// Modifier le statut d'une commande
router.put("/:id/statut", updateStatutCommande);
// Récupérer une commande par ID
router.get("/:id", getCommandeById);


module.exports = router;