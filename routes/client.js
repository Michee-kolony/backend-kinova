
const express = require('express');
const router = express.Router();

const clientCtrl = require('../controllers/client');

router.post('/register', clientCtrl.registerClient);
router.get('/', clientCtrl.getallclient);
router.post('/login', clientCtrl.loginClient);
router.delete('/:id', clientCtrl.deleteClient);

module.exports = router;


module.exports = router;