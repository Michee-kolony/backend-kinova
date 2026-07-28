const express = require('express');
const { sendMessage, getMessage, getoneMessage, deleteMessage } = require('../controllers/messages');
const router = express.Router();

router.post('/', sendMessage);
router.get('/', getMessage);
router.get('/:id', getoneMessage);
router.delete('/:id', deleteMessage);

module.exports = router;