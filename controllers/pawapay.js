const Commande = require("../models/commande");
const transporter = require("../config/mail");


// =======================================
// ENVOYER MAIL CONFIRMATION PAIEMENT
// =======================================

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





<!-- HEADER -->

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






<!-- CONTENU -->

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

${commande.montantAPayer} ${commande.devise}

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






<!-- CACHE -->

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






<!-- FOOTER -->


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


console.log("Mail confirmation envoyé");


}

catch(error){


console.log(
"Erreur mail confirmation :",
error.message
);


}


}






// =======================================
// WEBHOOK PAWAPAY
// =======================================


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







        if(paiement.status === "COMPLETED"){



            commande.statutPaiement =
            "PAYE";



            commande.statutCommande =
            "CONFIRMEE";



            commande.providerTransactionId =
            paiement.providerTransactionId;


        }







        if(paiement.status === "FAILED"){


            commande.statutPaiement =
            "ECHEC";


        }








        await commande.save();









        // Envoyer le mail seulement une fois

        if(

            paiement.status === "COMPLETED" &&

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