// routes/panierRoutes.js
const express = require('express');
const router = express.Router();
const panierController = require('../controllers/panier');

// Routes CRUD
router.post('/creer', panierController.creerPanier);
router.get('/:utilisateurId', panierController.getPanier);
router.post('/ajouter', panierController.ajouterArticle);
router.put('/quantite', panierController.mettreAJourQuantite);
router.delete('/supprimer', panierController.supprimerArticle);
router.delete('/vider', panierController.viderPanier);

// Routes pour les codes promo
router.post('/code-promo', panierController.appliquerCodePromo);
router.delete('/code-promo', panierController.supprimerCodePromo);

// Routes pour les statistiques
router.get('/count/:utilisateurId', panierController.compterArticles);

// Routes admin
router.get('/admin/tous', panierController.getAllPaniers);
router.put('/admin/:panierId/statut', panierController.changerStatut);
router.delete('/admin/:panierId', panierController.supprimerPanier);

module.exports = router;