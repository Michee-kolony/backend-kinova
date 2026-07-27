const jwt = require("jsonwebtoken");

const anyUser = (req, res, next) => {
    try {
        // ==========================================
        // 1. RÉCUPÉRER LE TOKEN
        // ==========================================

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Accès refusé. Vous devez être connecté."
            });
        }

        // ==========================================
        // 2. VÉRIFIER LE FORMAT DU TOKEN
        // Format attendu : Bearer TOKEN
        // ==========================================

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Format du token invalide."
            });
        }

        const token = parts[1];

        // ==========================================
        // 3. VÉRIFIER ET DÉCODER LE TOKEN
        // ==========================================

        const decoded = jwt.verify(
            token,
            "RANDOM_TOKEN_ADMIN"
        );

        // ==========================================
        // 4. IDENTIFIER L'UTILISATEUR
        // ==========================================

        // Cas : Administrateur
        if (decoded.adminId) {

            req.user = {
                id: decoded.adminId,
                role: decoded.role,
                type: "admin"
            };

        }

        // Cas : Vendeur
        else if (decoded.vendeurId) {

            req.user = {
                id: decoded.vendeurId,
                role: "vendeur",
                type: "vendeur"
            };

        }

        // ==========================================
        // 5. UTILISATEUR NON AUTORISÉ
        // ==========================================

        else {
            return res.status(403).json({
                success: false,
                message: "Accès refusé. Vous n'êtes pas autorisé à effectuer cette action."
            });
        }

        // ==========================================
        // 6. CONTINUER VERS LE CONTROLLER
        // ==========================================

        next();

    } catch (error) {

        console.error("❌ Erreur middleware anyUser :", error);

        // ==========================================
        // TOKEN EXPIRÉ
        // ==========================================

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Votre session a expiré. Veuillez vous reconnecter."
            });
        }

        // ==========================================
        // TOKEN INVALIDE
        // ==========================================

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Token invalide ou non autorisé."
            });
        }

        // ==========================================
        // AUTRE ERREUR
        // ==========================================

        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la vérification de l'authentification."
        });
    }
};

module.exports = anyUser;