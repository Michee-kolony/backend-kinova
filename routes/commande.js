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
    updateStatutCommandeAdmin,
    getCommandesLivreur
} = require("../controllers/commande");

const anyUser = require("../middlewares/anyuser");
const isAdmin = require("../middlewares/isAdmin");
const authLivreur = require("../middlewares/authLivreur");
const authStaff = require("../middlewares/authStaff");


// Créer une commande
router.post("/", creerCommande);

// LIVREUR : commandes qui lui sont affectées (avant /:id générique)
router.get("/livreur/mes-commandes", authLivreur, getCommandesLivreur);

//Recupère toutes les commandes
// ADMIN / VENDEUR / LIVREUR : les 3 ont le droit de voir toutes les commandes
router.get("/admin/", authStaff, getallCommandes);

//RECUPERE UNE COMMANDE PAR ID
router.get("/admin/:id", authStaff, getoneCommande);

//AFFECTER UN LIVREUR À UNE COMMANDE (avant /admin/:id)
router.put("/admin/:id/livreur", anyUser, isAdmin, affecterLivreurCommande);

//MODIFIER LE STATUT DE LIVRAISON DE LA COMMANDE (avant /admin/:id)
// ADMIN / VENDEUR / LIVREUR : seuls les 3 peuvent modifier le statut de livraison
router.put("/admin/:id/statut-livraison", authStaff, updateStatutLivraisonCommande);

//MODIFIER LE STATUT GLOBAL DE LA COMMANDE (avant /admin/:id)
router.put("/admin/:id/statut-commande", authStaff, updateStatutCommandeAdmin);

//MODIFIER LE STATUT D'UN ARTICLE DE LA COMMANDE
router.put("/admin/:id", authStaff, updateStatutArticleCommande);

router.get('/verifier-paiement/:id', verifierPaiement);

// Récupérer toutes les commandes d'un utilisateur
router.get("/utilisateur/:utilisateurId", getCommandesUtilisateur);
// Modifier le statut d'une commande (ADMIN / VENDEUR / LIVREUR uniquement)
router.put("/:id/statut", authStaff, updateStatutCommande);
// Récupérer une commande par ID
router.get("/:id", getCommandeById);


module.exports = router;