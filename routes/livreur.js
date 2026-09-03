const express = require("express");
const router = express.Router();

const livreurController = require("../controllers/livreur");
const uploadLivreur = require("../middlewares/uploadLivreur");

router.post("/register", uploadLivreur.single("photo"), livreurController.inscrireLivreur);
router.post("/login", livreurController.loginLivreur);
router.get("/", livreurController.getAllLivreur);
router.get("/:id", livreurController.getOneLivreur);
router.delete("/:id", livreurController.deleteLivreur);

module.exports = router;
