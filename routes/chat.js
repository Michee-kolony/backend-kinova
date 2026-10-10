const express = require("express");
const router = express.Router();

const authChat = require("../middlewares/authChat");
const upload = require("../middlewares/upload");
const chatController = require("../controllers/chat");

// ==========================================
// MESSAGERIE PRIVÉE CLIENT <-> VENDEUR
// Accessible aux clients et vendeurs connectés
// ==========================================
router.use(authChat);

router.get("/conversations", chatController.listerConversations);
router.post("/conversations", chatController.demarrerConversation);
router.get("/non-lus", chatController.compterNonLus);
router.post("/push-token", chatController.enregistrerPushToken);

router.get("/conversations/:id", chatController.getConversation);
router.delete("/conversations/:id", chatController.supprimerConversation);
router.get("/conversations/:id/messages", chatController.listerMessages);
router.post("/conversations/:id/messages", upload.array("image", 1), chatController.envoyerMessage);
router.put("/conversations/:id/lu", chatController.marquerLu);

module.exports = router;
