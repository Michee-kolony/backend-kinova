const Admin = require('../models/administrateur');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


// =======================
// REGISTER ADMIN
// =======================
exports.registerAdmin = (req, res, next) => {

    bcrypt.hash(req.body.password, 10)
        .then(hash => {

            const admin = new Admin({
                name: req.body.name,
                email: req.body.email,
                telephone: req.body.telephone,
                addresse: req.body.addresse,
                role: req.body.role, // admin ou superadmin
                password: hash
            });

            return admin.save();
        })
        .then(() => {
            res.status(201).json({
                message: "Administrateur créé avec succès"
            });
        })
        .catch(error => {
            res.status(500).json({
                error: error.message
            });
        });
};


// =======================
// LOGIN ADMIN
// =======================
exports.loginAdmin = (req, res, next) => {

    Admin.findOne({ email: req.body.email })
        .then(admin => {

            if (!admin) {
                return res.status(401).json({
                    message: "Email incorrect"
                });
            }

            bcrypt.compare(req.body.password, admin.password)
                .then(valid => {

                    if (!valid) {
                        return res.status(401).json({
                            message: "Mot de passe incorrect"
                        });
                    }

                    const token = jwt.sign(
                        {
                            adminId: admin._id,
                            role: admin.role
                        },
                        process.env.TOKEN_SECRET || 'RANDOM_TOKEN_ADMIN',
                        { expiresIn: '24h' }
                    );

                    res.status(200).json({
                        adminId: admin._id,
                        role: admin.role,
                        token: token,
                        name: admin.name,
                        email: admin.email,
                        telephone: admin.telephone
                    });

                })
                .catch(error => {
                    res.status(500).json({
                        error: error.message
                    });
                });

        })
        .catch(error => {
            res.status(500).json({
                error: error.message
            });
        });
};


// =======================
// GET ALL ADMINS
// =======================
exports.getallAdmin = (req, res, next) => {

    Admin.find()
        .then(admins => {
            res.status(200).json(admins);
        })
        .catch(error => {
            res.status(500).json({
                error: error.message
            });
        });
};


// =======================
// DELETE ADMIN
// =======================
exports.deleteAdmin = (req, res, next) => {

    Admin.findByIdAndDelete(req.params.id)
        .then(admin => {

            if (!admin) {
                return res.status(404).json({
                    message: "Administrateur introuvable"
                });
            }

            res.status(200).json({
                message: "Administrateur supprimé avec succès"
            });

        })
        .catch(error => {
            res.status(500).json({
                error: error.message
            });
        });
};