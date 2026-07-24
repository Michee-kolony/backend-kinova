const express = require("express");
const router = express.Router();

const vendeurController = require("../controllers/vendeur");

// PLUS DE MIDDLEWARE UPLOAD - La photo n'est plus obligatoire
router.post("/register", vendeurController.inscrireVendeur);
router.post("/login", vendeurController.loginVendeur);
router.get("/", vendeurController.getVendeur);
router.delete("/:id", vendeurController.supprimerVendeur);

module.exports = router;