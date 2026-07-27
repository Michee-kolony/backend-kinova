const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const anyUser = require("../middlewares/anyUser");

const articleController = require("../controllers/article");

// ==========================================
// CRÉER UN ARTICLE
// Accessible uniquement aux vendeurs et admins
// ==========================================
router.post( "/",anyUser, upload.array("images", 3), articleController.createArticle);

// ==========================================
// RÉCUPÉRER TOUS LES ARTICLES
// Accessible à tout le monde
// ==========================================
router.get("/", articleController.getArticle);
// ==========================================
// RÉCUPÉRER UN ARTICLE
// Accessible à tout le monde
// ==========================================
router.get("/:id", articleController.getOneArticle);
// ==========================================
// SUPPRIMER UN ARTICLE
// Accessible uniquement aux vendeurs et admins
// ==========================================
router.delete(
    "/:id",
    anyUser,
    articleController.deleteArticle
);

// ==========================================
// MODIFIER UN ARTICLE
// Accessible uniquement aux vendeurs et admins
// ==========================================
router.put(
    "/:id",
    anyUser,
    upload.array("images", 3),
    articleController.updateArticle
);

module.exports = router;