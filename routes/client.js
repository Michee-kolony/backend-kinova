
const express = require('express');
const router = express.Router();

const clientCtrl = require('../controllers/client');

router.post('/register', clientCtrl.registerClient);
router.get('/', clientCtrl.getallclient);
router.get('/:id', clientCtrl.getoneClient);
router.post('/login', clientCtrl.loginClient);
router.delete('/:id', clientCtrl.deleteClient);
router.put('/:clientId', clientCtrl.updateClient);

module.exports = router;