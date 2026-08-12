const Commande =
    require("../models/commande");

const VendeurPaye =
    require("../models/vendeurPaye");

const transporter =
    require("../config/mail");


// ======================================================
// MAIL CONFIRMATION CLIENT
// ======================================================

async function envoyerMailConfirmation(commande) {

    try {

        await transporter.sendMail({

            from:
                `"Kinova" <${process.env.SMTP_USER}>`,

            to:
                commande.emailUtilisateur,

            subject:
                `Paiement confirmé - ${commande.numeroCommande}`,

            html: `

<!DOCTYPE html>

<html>

<body style="
margin:0;
padding:0;
background:#f3f4f6;
font-family:Arial,Helvetica,sans-serif;
">

<div style="
max-width:650px;
margin:40px auto;
background:white;
border-radius:15px;
overflow:hidden;
box-shadow:0 5px 20px rgba(0,0,0,0.1);
">

<div style="
background:#16a34a;
padding:30px;
text-align:center;
color:white;
">

<div style="
background:white;
width:110px;
height:110px;
border-radius:50%;
margin:auto;
display:flex;
align-items:center;
justify-content:center;
overflow:hidden;
">

<img
src="https://kinova-backend.tech/images/icon.png"
alt="Logo Kinova"
style="
width:100%;
height:100%;
object-fit:contain;
"
>

</div>

<h1 style="
margin:15px 0 5px;
">
KINOVA
</h1>

<h2 style="
margin:0;
">
Paiement confirmé
</h2>

</div>


<div style="
padding:35px;
">

<p>
Bonjour,
</p>

<p>
Votre paiement a été confirmé avec succès.
</p>

<div style="
border:1px solid #eeeeee;
padding:20px;
border-radius:10px;
">

<p>
<strong>
Commande :
</strong>
<br>
${commande.numeroCommande}
</p>

<p>
<strong>
Montant payé :
</strong>
<br>

<span style="
font-size:25px;
font-weight:bold;
">

${commande.montantAPayer}
${commande.devise}

</span>

</p>

<p>
<strong>
Statut paiement :
</strong>
<br>

<span style="
color:#16a34a;
font-weight:bold;
">

PAYE

</span>

</p>

<p>
<strong>
Statut commande :
</strong>
<br>

<span style="
color:#16a34a;
font-weight:bold;
">

CONFIRMEE

</span>

</p>

</div>


<div style="
margin-top:30px;
text-align:center;
">

<div style="
display:inline-block;
border:3px solid #16a34a;
color:#16a34a;
padding:15px 25px;
font-weight:bold;
border-radius:50%;
transform:rotate(-10deg);
">

PAYÉ

</div>

</div>

</div>


<div style="
background:#111827;
padding:20px;
color:white;
text-align:center;
">

Merci d'avoir acheté sur Kinova.

<br><br>

Equipe Kinova

</div>

</div>

</body>

</html>

`

        });


        console.log(
            "Mail confirmation envoyé"
        );

    }
    catch (error) {

        console.error(
            "Erreur mail confirmation :",
            error.message
        );

    }

}


// ======================================================
// WEBHOOK PAWAPAY
// DEPOSIT + PAYOUT
// ======================================================

exports.webhookPawaPay =
    async (req, res) => {

        try {

            console.log(
                "\n======================================"
            );

            console.log(
                "========= PAWAPAY WEBHOOK ============="
            );

            console.log(
                new Date().toISOString()
            );

            console.log(
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );

            console.log(
                "======================================\n"
            );


            const paiement =
                req.body;


            // ==================================================
            // IDENTIFIANTS
            // ==================================================

            const depositId =
                paiement.depositId || null;

            const payoutId =
                paiement.payoutId || null;

            const status =
                paiement.status || null;


            // ==================================================
            // PAYOUT VENDEUR
            // ==================================================

            if (payoutId) {

                console.log(
                    "💰 CALLBACK PAYOUT DÉTECTÉ"
                );

                console.log(
                    "Payout ID :",
                    payoutId
                );

                console.log(
                    "Status :",
                    status
                );


                // ==============================================
                // RECHERCHE
                // ==============================================

                const payout =
                    await VendeurPaye.findOne({

                        payoutId

                    });


                if (!payout) {

                    console.error(
                        "❌ Payout introuvable :",
                        payoutId
                    );

                    /*
                     * On retourne 200 pour éviter de provoquer
                     * inutilement des répétitions de callback
                     * pour un payout que notre base ne connaît pas.
                     */

                    return res.status(200).json({

                        message:
                            "Payout non trouvé dans la base",

                        payoutId

                    });

                }


                const ancienStatut =
                    payout.statut;


                // ==============================================
                // PROTEGER UN COMPLETED
                // ==============================================

                if (
                    payout.statut === "COMPLETED"
                ) {

                    console.log(
                        "ℹ️ Payout déjà COMPLETED"
                    );

                    return res.status(200).json({

                        message:
                            "Payout déjà traité",

                        payoutId,

                        statut:
                            payout.statut

                    });

                }


                // ==============================================
                // PAWAPAY STATUS
                // ==============================================

                if (status) {

                    payout.pawapayStatus =
                        status;

                }


                // ==============================================
                // PROVIDER TRANSACTION ID
                // ==============================================

                if (
                    paiement.providerTransactionId
                ) {

                    payout.providerTransactionId =
                        paiement.providerTransactionId;

                }


                // ==============================================
                // ACCEPTED
                // ==============================================

                if (
                    status === "ACCEPTED"
                ) {

                    payout.statut =
                        "ACCEPTED";

                    /*
                     * IMPORTANT :
                     * ACCEPTED n'est PAS un paiement terminé.
                     */

                    payout.datePaiement =
                        null;

                }


                // ==============================================
                // COMPLETED
                // ==============================================

                if (
                    status === "COMPLETED"
                ) {

                    console.log(
                        "✅ PAWAPAY CONFIRME LE PAYOUT"
                    );


                    payout.statut =
                        "COMPLETED";


                    /*
                     * C'est uniquement ici que nous
                     * considérons le vendeur payé.
                     */

                    if (!payout.datePaiement) {

                        payout.datePaiement =
                            paiement.completedAt
                                ? new Date(
                                    paiement.completedAt
                                )
                                : new Date();

                    }


                    payout.failureReason =
                        null;

                }


                // ==============================================
                // FAILED
                // ==============================================

                if (
                    status === "FAILED"
                ) {

                    payout.statut =
                        "FAILED";


                    payout.datePaiement =
                        null;


                    const failure =
                        paiement.failureReason;


                    if (
                        typeof failure === "string"
                    ) {

                        payout.failureReason =
                            failure;

                    }
                    else if (
                        failure?.failureMessage
                    ) {

                        payout.failureReason =
                            failure.failureMessage;

                    }
                    else if (
                        failure?.failureCode
                    ) {

                        payout.failureReason =
                            failure.failureCode;

                    }
                    else {

                        payout.failureReason =
                            "Payout échoué";

                    }

                }


                // ==============================================
                // STATUT INCONNU
                // ==============================================

                if (
                    ![
                        "ACCEPTED",
                        "COMPLETED",
                        "FAILED"
                    ].includes(status)
                ) {

                    console.warn(
                        "⚠️ Statut payout inconnu :",
                        status
                    );

                }


                // ==============================================
                // SAUVEGARDER
                // ==============================================

                await payout.save();


                // ==============================================
                // LOG FINAL
                // ==============================================

                console.log(
                    "======================================"
                );

                console.log(
                    "✅ PAYOUT MIS À JOUR"
                );

                console.log({

                    payoutId:
                        payout.payoutId,

                    ancienStatut,

                    nouveauStatut:
                        payout.statut,

                    pawapayStatus:
                        payout.pawapayStatus,

                    providerTransactionId:
                        payout.providerTransactionId,

                    datePaiement:
                        payout.datePaiement

                });

                console.log(
                    "======================================"
                );


                return res.status(200).json({

                    message:
                        "Callback payout traité",

                    payoutId:
                        payout.payoutId,

                    statut:
                        payout.statut

                });

            }


            // ==================================================
            // DEPOSIT CLIENT
            // ==================================================

            if (depositId) {

                console.log(
                    "💳 CALLBACK DEPOSIT DÉTECTÉ"
                );


                const commande =
                    await Commande.findOne({

                        depositId

                    });


                if (!commande) {

                    console.error(
                        "❌ Commande introuvable :",
                        depositId
                    );

                    return res.status(404).json({

                        message:
                            "Commande introuvable"

                    });

                }


                const ancienStatut =
                    commande.statutPaiement;


                // ==============================================
                // PAWAPAY STATUS
                // ==============================================

                commande.metadata = {

                    ...commande.metadata,

                    pawapayStatus:
                        status

                };


                // ==============================================
                // COMPLETED
                // ==============================================

                if (
                    status === "COMPLETED"
                ) {

                    commande.statutPaiement =
                        "PAYE";


                    commande.statutCommande =
                        "CONFIRMEE";


                    if (
                        paiement.providerTransactionId
                    ) {

                        commande.providerTransactionId =
                            paiement.providerTransactionId;

                    }

                }


                // ==============================================
                // FAILED
                // ==============================================

                if (
                    status === "FAILED"
                ) {

                    commande.statutPaiement =
                        "ECHEC";

                }


                // ==============================================
                // SAUVEGARDER
                // ==============================================

                await commande.save();


                // ==============================================
                // MAIL UNE SEULE FOIS
                // ==============================================

                if (

                    status === "COMPLETED"

                    &&

                    ancienStatut !== "PAYE"

                ) {

                    await envoyerMailConfirmation(
                        commande
                    );

                }


                console.log(
                    "======================================"
                );

                console.log(
                    "✅ COMMANDE MISE À JOUR"
                );

                console.log({

                    depositId,

                    ancienStatut,

                    nouveauStatut:
                        commande.statutPaiement

                });

                console.log(
                    "======================================"
                );


                return res.status(200).json({

                    message:
                        "Callback deposit traité",

                    depositId,

                    statut:
                        commande.statutPaiement

                });

            }


            // ==================================================
            // CALLBACK INCONNU
            // ==================================================

            console.warn(
                "⚠️ CALLBACK PAWAPAY INCONNU"
            );


            return res.status(400).json({

                message:
                    "depositId ou payoutId manquant"

            });

        }
        catch (error) {

            console.error(
                "======================================"
            );

            console.error(
                "❌ ERREUR WEBHOOK PAWAPAY"
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
                    "Erreur webhook PawaPay",

                error:
                    error.message

            });

        }

    };