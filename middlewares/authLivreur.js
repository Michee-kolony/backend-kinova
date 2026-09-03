const jwt = require("jsonwebtoken");

const authLivreur = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Accès refusé. Vous devez être connecté."
            });
        }

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Format du token invalide."
            });
        }

        const token = parts[1];

        const decoded = jwt.verify(
            token,
            process.env.TOKEN_SECRET || "RANDOM_TOKEN_ADMIN"
        );

        if (!decoded.livreurId) {
            return res.status(403).json({
                success: false,
                message: "Accès refusé. Vous n'êtes pas autorisé à effectuer cette action."
            });
        }

        req.livreur = {
            id: decoded.livreurId,
            email: decoded.email
        };

        next();

    } catch (error) {

        console.error("❌ Erreur middleware authLivreur :", error);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Votre session a expiré. Veuillez vous reconnecter."
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Token invalide ou non autorisé."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la vérification de l'authentification."
        });
    }
};

module.exports = authLivreur;
