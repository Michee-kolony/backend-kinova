const { verifierTokenChat } = require('../middlewares/authChat');
const Conversation = require('../models/conversation');
const { salle } = require('../controllers/chat');

// Évènements temps réel de la messagerie client <-> vendeur
module.exports = function brancherChat(socket) {

  // Le client/vendeur rejoint sa salle privée avec son token
  socket.on('chat:join', (token) => {
    const user = verifierTokenChat(token);
    if (!user) return socket.emit('chat:erreur', { message: 'Session expirée' });
    socket.data.chatUser = user;
    socket.join(salle(user.role, user.id));
  });

  // Indicateur "en train d'écrire..." relayé à l'autre participant
  socket.on('chat:typing', async ({ conversationId, enTrain } = {}) => {
    try {
      const user = socket.data.chatUser;
      if (!user || !conversationId) return;

      const conv = await Conversation.findById(conversationId).select('client vendeur').lean();
      if (!conv || String(conv[user.role]) !== user.id) return;

      const autre = user.role === 'client' ? 'vendeur' : 'client';
      socket.to(salle(autre, conv[autre])).emit('chat:typing', { conversationId, enTrain: !!enTrain });
    } catch (e) { /* identifiant invalide : ignoré */ }
  });

};
