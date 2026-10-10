const multer = require("multer");

// Les fichiers restent en mémoire : ils sont vérifiés / convertis
// (HEIC -> JPEG) puis envoyés sur R2 par services/r2Images.js
const upload = multer({

    storage: multer.memoryStorage(),

    limits:{
        // Les photos des téléphones récents dépassent souvent 10 Mo
        fileSize:25*1024*1024
    },

    fileFilter: function(req, file, cb){

        const name = (file.originalname || "").toLowerCase();

        if (file.mimetype === "image/gif" || name.endsWith(".gif")) {
            const err = new Error("Les images GIF ne sont pas acceptées");
            err.status = 400;
            return cb(err);
        }

        // Le vrai format est contrôlé sur les octets du fichier,
        // certains téléphones envoient "application/octet-stream"
        cb(null, true);

    }

});

// Renvoie les erreurs d'upload en JSON (taille, GIF, trop de fichiers...)
module.exports.array = (field, maxCount) => (req, res, next) => {

    upload.array(field, maxCount)(req, res, err => {

        if (!err) return next();

        if (err instanceof multer.MulterError) {
            const message = err.code === "LIMIT_FILE_SIZE"
                ? "Image trop lourde (25 Mo maximum)"
                : err.code === "LIMIT_UNEXPECTED_FILE"
                    ? `Maximum ${maxCount} images`
                    : err.message;
            return res.status(400).json({ message });
        }

        res.status(err.status || 500).json({ message: err.message });

    });

};
