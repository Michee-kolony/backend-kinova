const Commande = require("../models/commande");
const Vendeur = require("../models/vendeur");
const VendeurPaye = require("../models/vendeurPaye");

const envoyerPayoutPawaPay =
    require("../services/pawapayPayout");


// =====================================================
// EFFECTUER PAYOUT MANUEL VENDEUR
// =====================================================
exports.effectuerPayoutVendeur = async (req, res) => {

    try {

        const {
            vendeurId,
            numeroCommande,
            telephone,
            operateur
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (!vendeurId) {

            return res.status(400).json({
                message: "vendeurId est obligatoire"
            });

        }

        if (!numeroCommande) {

            return res.status(400).json({
                message: "numeroCommande est obligatoire"
            });

        }

        if (!telephone) {

            return res.status(400).json({
                message: "telephone est obligatoire"
            });

        }

        if (!operateur) {

            return res.status(400).json({
                message: "operateur est obligatoire"
            });

        }


        // =================================================
        // RECHERCHER VENDEUR
        // =================================================

        const vendeur =
            await Vendeur.findById(vendeurId);

        if (!vendeur) {

            return res.status(404).json({
                message: "Vendeur introuvable"
            });

        }


        // =================================================
        // RECHERCHER COMMANDE
        // GRÂCE AU NUMERO DE COMMANDE
        // =================================================

        const commande =
            await Commande.findOne({
                numeroCommande
            });

        if (!commande) {

            return res.status(404).json({

                message:
                    "Commande introuvable avec ce numéro",

                numeroCommande

            });

        }


        // =================================================
        // VÉRIFIER PAIEMENT CLIENT
        // =================================================

        if (
            commande.statutPaiement !== "PAYE"
        ) {

            return res.status(400).json({

                message:
                    "Cette commande n'est pas encore payée",

                statutPaiement:
                    commande.statutPaiement

            });

        }


        // =================================================
        // VÉRIFIER QUE LA COMMANDE EST EN PRÉPARATION
        // OU EN COURS DE LIVRAISON
        // =================================================

        const statutsLivraisonAutorises = [
            "EN_COURS_PREPARATION",
            "EN_COURS_LIVRAISON"
        ];

        if (
            !statutsLivraisonAutorises.includes(
                commande.statutLivraison
            )
        ) {

            return res.status(400).json({

                message:
                    "La commande doit être en cours de préparation ou en cours de livraison pour effectuer le payout",

                statutLivraison:
                    commande.statutLivraison

            });

        }


        // =================================================
        // RECHERCHER LES ARTICLES DU VENDEUR
        // =================================================

        const articlesVendeur =
            commande.articles.filter(

                article =>

                    String(article.vendeurId) ===
                    String(vendeurId)

            );


        if (!articlesVendeur.length) {

            return res.status(404).json({

                message:
                    "Aucun article de ce vendeur dans cette commande",

                vendeurId,
                numeroCommande

            });

        }


        // =================================================
        // CALCUL DU MONTANT
        // =================================================

        const montant =
            articlesVendeur.reduce(

                (total, article) => {

                    const prix =
                        Number(
                            article.prixFinal
                        ) || 0;

                    const quantite =
                        Number(
                            article.quantite
                        ) || 0;

                    return total +
                        (prix * quantite);

                },

                0

            );


        if (montant <= 0) {

            return res.status(400).json({

                message:
                    "Le montant du payout est invalide",

                montant

            });

        }


        // =================================================
        // VÉRIFIER SI LE VENDEUR A DÉJÀ ÉTÉ PAYÉ
        // =================================================

        const payoutExistant =
            await VendeurPaye.findOne({

                vendeurId,

                commandeId:
                    commande._id,

                statut: {
                    $in: [
                        "EN_ATTENTE",
                        "ACCEPTED",
                        "COMPLETED"
                    ]
                }

            });


        if (payoutExistant) {

            return res.status(400).json({

                message:
                    "Ce vendeur a déjà reçu ou possède un payout pour cette commande",

                payout:
                    payoutExistant

            });

        }


        // =================================================
        // PRÉPARER LES ARTICLES POUR L'HISTORIQUE
        // =================================================

        const articlesHistorique =
            articlesVendeur.map(article => ({

                articleId:
                    article.articleId,

                nomArticle:
                    article.nom,

                quantite:
                    article.quantite,

                prixUnitaire:
                    article.prixFinal,

                montant:
                    Number(article.prixFinal) *
                    Number(article.quantite)

            }));


        // =================================================
        // ENVOYER LE PAYOUT À PAWAPAY
        // =================================================

        const paiement =
            await envoyerPayoutPawaPay({

                telephone,

                operateur,

                montant,

                devise:
                    commande.devise,

                numeroCommande,

                vendeurId

            });


        // =================================================
        // CRÉER L'HISTORIQUE VENDEURPAYE
        // =================================================

        const payout =
            await VendeurPaye.create({

                vendeurId,

                commandeId:
                    commande._id,

                numeroCommande,

                articles:
                    articlesHistorique,

                payoutId:
                    paiement.payoutId,

                providerTransactionId:
                    paiement.providerTransactionId ||
                    null,

                montant,

                devise:
                    commande.devise,

                telephone,

                operateur,

                statut:
                    paiement.status ||
                    "ACCEPTED",

                effectuePar:
                    req.user?._id ||
                    req.user?.id ||
                    null,

                datePaiement:
                    new Date(),

                pawapayStatus:
                    paiement.status ||
                    null,

                failureReason:
                    null

            });


        // =================================================
        // RÉPONSE
        // =================================================

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

// =====================================================
// RÉCUPÉRER TOUS LES PAYOUTS
// =====================================================

exports.getTousLesPayouts = async (req, res) => {

    try {

        const payouts =
            await VendeurPaye
                .find()
                .populate({
                    path: "vendeurId",
                    select:
                        "storeName phoneNumber email storeCategory"
                })
                .populate({
                    path: "commandeId",
                    select:
                        "numeroCommande"
                })
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