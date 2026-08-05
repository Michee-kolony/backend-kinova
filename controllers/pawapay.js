const Commande = require("../models/commande");
const transporter = require("../config/mail");


async function envoyerMailConfirmation(commande) {

    try {


        await transporter.sendMail({

            from: `"Kinova" <${process.env.SMTP_USER}>`,

            to: commande.emailUtilisateur,

            subject:`Paiement confirmé - ${commande.numeroCommande}`,

            html:`

            <h2>Paiement confirmé</h2>

            <p>Bonjour,</p>

            <p>Votre paiement a été confirmé avec succès.</p>

            <hr>

            <p>
            <strong>Commande :</strong>
            ${commande.numeroCommande}
            </p>


            <p>
            <strong>Montant :</strong>
            ${commande.montantAPayer} ${commande.devise}
            </p>


            <p>
            <strong>Statut paiement :</strong>
            PAYE
            </p>


            <p>
            <strong>Statut commande :</strong>
            CONFIRMEE
            </p>


            <hr>

            <p>
            Merci d'avoir acheté sur Kinova.
            </p>

            `

        });


        console.log("Mail confirmation envoyé");


    }
    catch(error){

        console.log(
            "Erreur mail confirmation :",
            error.message
        );

    }

}




exports.webhookPawaPay = async(req,res)=>{


    try{


        console.log(
            "========= PAWAPAY WEBHOOK ========="
        );


        console.log(
            JSON.stringify(req.body,null,2)
        );



        const paiement = req.body;



        const depositId = paiement.depositId;



        if(!depositId){


            return res.status(400).json({

                message:"DepositId manquant"

            });

        }





        const commande = await Commande.findOne({

            depositId

        });





        if(!commande){


            return res.status(404).json({

                message:"Commande introuvable"

            });

        }





        // garder ancien statut
        const ancienStatut =
        commande.statutPaiement;






        commande.metadata = {


            ...commande.metadata,


            pawapayStatus:
            paiement.status


        };







        if(paiement.status==="COMPLETED"){


            commande.statutPaiement =
            "PAYE";


            commande.statutCommande =
            "CONFIRMEE";


            commande.providerTransactionId =
            paiement.providerTransactionId;


        }






        if(paiement.status==="FAILED"){


            commande.statutPaiement =
            "ECHEC";


        }







        await commande.save();








        // Envoyer le mail une seule fois
        if(
            paiement.status==="COMPLETED" &&
            ancienStatut !== "PAYE"
        ){

            await envoyerMailConfirmation(commande);

        }






        console.log(
            "Commande mise à jour automatiquement"
        );



        return res.status(200).json({

            message:"Webhook reçu"

        });





    }
    catch(error){


        console.log(
            "ERREUR WEBHOOK PAWAPAY",
            error.message
        );


        return res.status(500).json({

            message:"Erreur webhook"

        });


    }


};