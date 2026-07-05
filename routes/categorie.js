const express = require('express');
const router = express.Router();
const categorieCTRL = require('../controllers/categorie');

router.get('/', categorieCTRL.getCategorie);
router.post('/', categorieCTRL.createCategorie);
router.delete('/:id', categorieCTRL.supprimerCategorie);

module.exports = router;