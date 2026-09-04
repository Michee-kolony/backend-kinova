const isAdmin = (req, res, next) => {

    if (!req.user || req.user.type !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Accès réservé aux administrateurs."
        });
    }

    next();

};

module.exports = isAdmin;
