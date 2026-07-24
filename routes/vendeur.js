const express = require("express");
const router = express.Router();

const vendeurController = require("../controllers/vendeur");
const uploadR2 = require("../middlewares/upload");

router.post("/register", uploadR2.single("profilePhoto"),vendeurController.inscrireVendeur);
router.get("/", vendeurController.getVendeur);
router.delete("/:id", vendeurController.supprimerVendeur);
router.post('/login', vendeurController.loginVendeur);

module.exports = router;