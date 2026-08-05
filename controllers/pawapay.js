const Commande = require("../models/commande");
const transporter = require("../config/mail");

async function envoyerMailConfirmation(commande) {


try {


await transporter.sendMail({


from:`"Kinova" <${process.env.SMTP_USER}>`,


to:commande.emailUtilisateur,


subject:`Paiement confirmé - ${commande.numeroCommande}`,


html:`


<!DOCTYPE html>

<html>


<body style="
margin:0;
background:#f3f4f6;
font-family:Arial;
">


<div style="
max-width:650px;
margin:40px auto;
background:white;
border-radius:15px;
overflow:hidden;
">



<div style="
background:#16a34a;
padding:30px;
text-align:center;
color:white;
">


<div style="
background:white;
color:#16a34a;
width:100px;
height:100px;
border-radius:50%;
margin:auto;
display:flex;
align-items:center;
justify-content:center;
font-size:25px;
font-weight:bold;
">

LOGO

</div>


<h1>
KINOVA
</h1>


<h2>
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
border:1px solid #eee;
padding:20px;
border-radius:10px;
">


<p>
<strong>Commande :</strong>

<br>

${commande.numeroCommande}

</p>



<p>

<strong>Montant payé :</strong>

<br>

<span style="
font-size:25px;
font-weight:bold;
">

${commande.montantAPayer} ${commande.devise}

</span>


</p>



<p>
<strong>Statut paiement :</strong>

<br>

<span style="
color:#16a34a;
font-weight:bold;
">

PAYE

</span>

</p>



<p>

<strong>Statut commande :</strong>

<br>

CONFIRMEE

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


</div>



</div>


</body>


</html>


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