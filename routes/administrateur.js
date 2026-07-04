const express = require('express');
const router = express.Router();
const { registerAdmin, loginAdmin, getallAdmin, deleteAdmin } = require('../controllers/administrateur');

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.get('/', getallAdmin);
router.delete('/:id', deleteAdmin);

module.exports = router;