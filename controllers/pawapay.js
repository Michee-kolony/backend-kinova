const Commande = require("../models/commande");



exports.webhookPawaPay = async(req,res)=>{


    try{


        console.log(
            "========= PAWAPAY WEBHOOK ========="
        );


        console.log(
            JSON.stringify(req.body,null,2)
        );



        const paiement = req.body;



        const depositId =
        paiement.depositId;



        if(!depositId){


            return res.status(400).json({

                message:"DepositId manquant"

            });


        }





        const commande =
        await Commande.findOne({

            depositId

        });




        if(!commande){


            return res.status(404).json({

                message:"Commande introuvable"

            });


        }





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




        console.log(
            "Commande mise à jour automatiquement"
        );



        res.status(200).json({

            message:"Webhook reçu"

        });





    }catch(error){



        console.log(
            "ERREUR WEBHOOK PAWAPAY",
            error.message
        );


        res.status(500).json({

            message:"Erreur webhook"

        });



    }


};