const express = require('express');
const router = express.Router();

const livraisonController = require("../controllers/livraison");
const authLivreur = require("../middlewares/authLivreur");

router.post("/position", authLivreur, livraisonController.mettreAJourPosition);
router.get("/:numeroCommande", livraisonController.getPositionLivraison);

module.exports = router;
