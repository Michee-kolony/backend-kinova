const express = require('express');
const router = express.Router();

const livraisonController = require("../controllers/livraison");
const authLivreur = require("../middlewares/authLivreur");
const anyUser = require("../middlewares/anyuser");
const isAdmin = require("../middlewares/isAdmin");

router.post("/position", authLivreur, livraisonController.mettreAJourPosition);

// Le livreur arrête de partager sa position (avant /:numeroCommande)
router.delete("/:numeroCommande", authLivreur, livraisonController.arreterPartagePosition);

// ADMIN : toutes les livraisons en cours, en temps réel (avant /:numeroCommande)
router.get("/admin/en-cours", anyUser, isAdmin, livraisonController.getLivraisonsEnCours);

router.get("/:numeroCommande", livraisonController.getPositionLivraison);

module.exports = router;
