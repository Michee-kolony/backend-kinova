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
    updateStatutArticleCommande,
    affecterLivreurCommande,
    updateStatutLivraisonCommande,
    updateStatutCommandeAdmin
} = require("../controllers/commande");

const anyUser = require("../middlewares/anyuser");
const isAdmin = require("../middlewares/isAdmin");


// Créer une commande
router.post("/", creerCommande);

//Recupère toutes les commandes
// ADMIN : toutes les commandes
router.get("/admin/", anyUser, isAdmin, getallCommandes);

//RECUPERE UNE COMMANDE PAR ID
router.get("/admin/:id", anyUser, isAdmin, getoneCommande);

//AFFECTER UN LIVREUR À UNE COMMANDE (avant /admin/:id)
router.put("/admin/:id/livreur", anyUser, isAdmin, affecterLivreurCommande);

//MODIFIER LE STATUT DE LIVRAISON DE LA COMMANDE (avant /admin/:id)
router.put("/admin/:id/statut-livraison", anyUser, isAdmin, updateStatutLivraisonCommande);

//MODIFIER LE STATUT GLOBAL DE LA COMMANDE (avant /admin/:id)
router.put("/admin/:id/statut-commande", anyUser, isAdmin, updateStatutCommandeAdmin);

//MODIFIER LE STATUT D'UN ARTICLE DE LA COMMANDE
router.put("/admin/:id", anyUser, isAdmin, updateStatutArticleCommande);

router.get('/verifier-paiement/:id', verifierPaiement);

// Récupérer toutes les commandes d'un utilisateur
router.get("/utilisateur/:utilisateurId", getCommandesUtilisateur);
// Modifier le statut d'une commande
router.put("/:id/statut", updateStatutCommande);
// Récupérer une commande par ID
router.get("/:id", getCommandeById);


module.exports = router;