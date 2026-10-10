const jwt = require("jsonwebtoken");

const SECRET_CLIENT = "RANDOM_TOKEN_CLIENT";
const SECRET_VENDEUR = process.env.TOKEN_SECRET || "RANDOM_TOKEN_ADMIN";

// Retourne { id, role } pour un token client ou vendeur, sinon null
function verifierTokenChat(token) {

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, SECRET_CLIENT);
        if (decoded.clientId) return { id: String(decoded.clientId), role: "client" };
    } catch (e) { /* pas un token client */ }

    try {
        const decoded = jwt.verify(token, SECRET_VENDEUR);
        if (decoded.vendeurId) return { id: String(decoded.vendeurId), role: "vendeur" };
    } catch (e) { /* pas un token vendeur */ }

    return null;
}

// Messagerie : accessible aux clients et aux vendeurs connectés.
// Peuple req.chatUser = { id, role }
const authChat = (req, res, next) => {

    const parts = (req.headers.authorization || "").split(" ");
    const token = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;

    const user = verifierTokenChat(token);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Votre session a expiré. Veuillez vous reconnecter."
        });
    }

    req.chatUser = user;
    next();
};

module.exports = authChat;
module.exports.verifierTokenChat = verifierTokenChat;
