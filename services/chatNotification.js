const { messaging } = require("../config/firebase");
const Token = require("../models/firebase");

const TOKENS_INVALIDES = [
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
    "messaging/invalid-argument"
];

function apercu(message) {
    if (message.type === "image") return "📷 Photo";
    if (message.type === "produit") return `🛍️ ${message.article?.nom || "Produit"}`;
    const texte = message.texte || "";
    return texte.length > 120 ? texte.slice(0, 117) + "..." : texte;
}

// Notifie le destinataire d'un nouveau message sur tous ses appareils.
// N'interrompt jamais l'envoi du message en cas d'échec.
exports.notifierNouveauMessage = async ({ destinataireId, destinataireRole, expediteurNom, conversationId, message }) => {

    try {

        const tokens = await Token.find({ userId: destinataireId, role: destinataireRole });

        if (!tokens.length) return;

        const body = apercu(message);

        const results = await Promise.allSettled(tokens.map(t => messaging.send({
            token: t.token,
            notification: { title: expediteurNom, body },
            data: {
                type: "chat",
                conversationId: String(conversationId)
            },
            android: {
                priority: "high",
                notification: { tag: `chat-${conversationId}` }
            },
            apns: {
                payload: { aps: { sound: "default", "thread-id": `chat-${conversationId}` } }
            }
        })));

        // Nettoyer les tokens d'appareils désinstallés
        const invalides = tokens
            .filter((t, i) => results[i].status === "rejected" && TOKENS_INVALIDES.includes(results[i].reason?.code))
            .map(t => t._id);

        if (invalides.length) await Token.deleteMany({ _id: { $in: invalides } });

    } catch (error) {
        console.log("Erreur notification messagerie :", error.message);
    }
};
