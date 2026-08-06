const express = require("express");

const router = express.Router();

const {
    creerCommande,
    getCommandesUtilisateur,
    getCommandeById,
    updateStatutCommande,
    verifierPaiement,
    getallCommandes,
    getoneCommande,
    updateStatutArticleCommande
} = require("../controllers/commande");


// Créer une commande
router.post("/", creerCommande);

//Recupère toutes les commandes
// ADMIN : toutes les commandes
router.get("/admin/", getallCommandes);

//RECUPERE UNE COMMANDE PAR ID
router.get("/admin/:id", getoneCommande);

//MODIFIER LE STATUT D'UNE COMMANDE
router.put("/admin/:id", updateStatutArticleCommande);

router.get('/verifier-paiement/:id', verifierPaiement);

// Récupérer toutes les commandes d'un utilisateur
router.get("/utilisateur/:utilisateurId", getCommandesUtilisateur);
// Modifier le statut d'une commande
router.put("/:id/statut", updateStatutCommande);
// Récupérer une commande par ID
router.get("/:id", getCommandeById);


module.exports = router;