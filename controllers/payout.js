const Commande = require("../models/commande");
const Vendeur = require("../models/vendeur");
const VendeurPaye = require("../models/vendeurPaye");

const envoyerPayoutPawaPay =
    require("../services/pawapayPayout");


// ======================================================
// EFFECTUER UN PAYOUT MANUEL AU VENDEUR
// ======================================================

exports.effectuerPayoutVendeur = async (req, res) => {

    try {

        const {
            commandeId,
            vendeurId,
            telephone,
            operateur
        } = req.body;


        // ==================================================
        // VALIDATION
        // ==================================================

        if (!commandeId || !vendeurId) {

            return res.status(400).json({
                message:
                    "commandeId et vendeurId sont obligatoires"
            });

        }


        // ==================================================
        // TELEPHONE ET OPERATEUR SAISIS PAR ADMIN
        // ==================================================

        if (!telephone) {

            return res.status(400).json({
                message:
                    "Le numéro de téléphone est obligatoire"
            });

        }

        if (!operateur) {

            return res.status(400).json({
                message:
                    "L'opérateur est obligatoire"
            });

        }


        // ==================================================
        // NORMALISATION TELEPHONE
        // ==================================================

        const telephoneNormalise =
            String(telephone)
                .replace(/\+/g, "")
                .replace(/\s/g, "")
                .replace(/-/g, "");


        // ==================================================
        // RECHERCHE COMMANDE
        // ==================================================

        const commande =
            await Commande.findById(commandeId);


        if (!commande) {

            return res.status(404).json({
                message:
                    "Commande introuvable"
            });

        }


        // ==================================================
        // VERIFIER PAIEMENT CLIENT
        // ==================================================

        if (
            commande.statutPaiement !== "PAYE"
        ) {

            return res.status(400).json({
                message:
                    "Cette commande n'est pas encore payée"
            });

        }


        // ==================================================
        // VERIFIER VENDEUR
        // ==================================================

        const vendeur =
            await Vendeur.findById(vendeurId);


        if (!vendeur) {

            return res.status(404).json({
                message:
                    "Vendeur introuvable"
            });

        }


        // ==================================================
        // RECHERCHER LES ARTICLES DU VENDEUR
        // DANS CETTE COMMANDE
        // ==================================================

        const articles =
            commande.articles.filter(

                article =>

                    String(article.vendeurId) ===
                    String(vendeurId)

            );


        if (!articles.length) {

            return res.status(404).json({
                message:
                    "Aucun article de ce vendeur dans cette commande"
            });

        }


        // ==================================================
        // VERIFIER LIVRAISON
        // ==================================================

        const tousLivres =
            articles.every(

                article =>
                    article.statutLivraison === "LIVRE"

            );


        if (!tousLivres) {

            return res.status(400).json({
                message:
                    "Tous les articles du vendeur doivent être livrés avant le payout"
            });

        }


        // ==================================================
        // VERIFIER SI UN PAYOUT EXISTE DEJA
        // ==================================================

        const payoutExistant =
            await VendeurPaye.findOne({

                commandeId,
                vendeurId,

                statut: {
                    $in: [
                        "EN_ATTENTE",
                        "ACCEPTED",
                        "COMPLETED"
                    ]
                }

            });


        if (payoutExistant) {

            return res.status(409).json({

                message:
                    "Un payout existe déjà pour ce vendeur dans cette commande",

                payout:
                    payoutExistant

            });

        }


        // ==================================================
        // PREPARER LES ARTICLES POUR L'HISTORIQUE
        // ==================================================

        const articlesPayout =
            articles.map(article => {

                const prixUnitaire =
                    Number(article.prixFinal || 0);

                const quantite =
                    Number(article.quantite || 1);

                const montant =
                    prixUnitaire * quantite;


                return {

                    articleId:
                        article.articleId,

                    nomArticle:
                        article.nom,

                    quantite,

                    prixUnitaire,

                    montant

                };

            });


        // ==================================================
        // CALCUL MONTANT TOTAL VENDEUR
        // ==================================================

        const montant =
            articlesPayout.reduce(

                (total, article) =>

                    total + article.montant,

                0

            );


        if (montant <= 0) {

            return res.status(400).json({
                message:
                    "Montant payout invalide"
            });

        }


        // ==================================================
        // DEVISE
        // ==================================================

        const devise =
            commande.devise || "USD";


        // ==================================================
        // ENVOYER LE PAYOUT À PAWAPAY
        // ==================================================

        const paiement =
            await envoyerPayoutPawaPay({

                telephone:
                    telephoneNormalise,

                operateur,

                montant,

                devise,

                numeroCommande:
                    commande.numeroCommande,

                vendeurId

            });


        // ==================================================
        // CREER HISTORIQUE VENDEURPAYE
        // ==================================================

        const payout =
            await VendeurPaye.create({

                vendeurId,

                commandeId,

                numeroCommande:
                    commande.numeroCommande,

                articles:
                    articlesPayout,

                payoutId:
                    paiement.payoutId,

                providerTransactionId:
                    paiement.providerTransactionId ||
                    null,

                montant,

                devise,

                telephone:
                    telephoneNormalise,

                operateur,

                statut:
                    paiement.status ||
                    "EN_ATTENTE",

                pawapayStatus:
                    paiement.status ||
                    null,

                // IMPORTANT :
                // le vendeur n'est PAS encore considéré
                // comme payé tant que PawaPay n'a pas
                // envoyé COMPLETED

                datePaiement:
                    paiement.status === "COMPLETED"
                        ? new Date()
                        : null,

                effectuePar:
                    req.user?._id ||
                    req.user?.id ||
                    null

            });


        // ==================================================
        // REPONSE
        // ==================================================

        return res.status(201).json({

            message:
                "Payout envoyé à PawaPay avec succès",

            payout

        });

    }
    catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "ERREUR PAYOUT VENDEUR"
        );

        console.error(
            error.response?.data ||
            error.message
        );

        console.error(
            "======================================"
        );


        return res.status(500).json({

            message:
                "Erreur lors du payout",

            error:
                error.response?.data ||
                error.message

        });

    }

};


// ======================================================
// RECUPERER TOUS LES PAYOUTS
// ======================================================

exports.getTousLesPayouts = async (req, res) => {

    try {

        const payouts =
            await VendeurPaye
                .find()
                .populate(
                    "vendeurId",
                    "nom prenom email"
                )
                .populate(
                    "commandeId",
                    "numeroCommande"
                )
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({

            total:
                payouts.length,

            payouts

        });

    }
    catch (error) {

        console.error(
            "ERREUR RECUPERATION PAYOUTS :",
            error.message
        );

        return res.status(500).json({

            message:
                "Erreur serveur",

            error:
                error.message

        });

    }

};


// ======================================================
// RECUPERER UN PAYOUT
// ======================================================

exports.getPayoutById = async (req, res) => {

    try {

        const payout =
            await VendeurPaye.findById(
                req.params.id
            )
            .populate(
                "vendeurId",
                "nom prenom email"
            )
            .populate(
                "commandeId",
                "numeroCommande"
            );


        if (!payout) {

            return res.status(404).json({

                message:
                    "Payout introuvable"

            });

        }


        return res.status(200).json({

            payout

        });

    }
    catch (error) {

        console.error(
            "ERREUR RECUPERATION PAYOUT :",
            error.message
        );

        return res.status(500).json({

            message:
                "Erreur serveur",

            error:
                error.message

        });

    }

};