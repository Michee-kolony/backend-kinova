const Commande = require("../models/commande");
const envoyerPaiementPawaPay = require("../services/pawapay");
const axios = require("axios");
const transporter = require("../config/mail");


// Fonction d'envoi MAIL COMMANDE
const envoyerMailCommande = async (commande) => {

    try {


        const paiementConfirme =
            commande.statutPaiement === "PAYE";



        const statutTexte = paiementConfirme
            ? "PAIEMENT CONFIRMÉ"
            : "PAIEMENT NON CONFIRMÉ";



        const statutCouleur = paiementConfirme
            ? "#16a34a"
            : "#dc2626";



        await transporter.sendMail({


            from: `"Kinova" <${process.env.SMTP_USER}>`,


            to: commande.emailUtilisateur,


            subject: `Commande ${commande.numeroCommande} - Kinova`,



            html: `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>Commande Kinova</title>

</head>


<body style="
margin:0;
padding:0;
background:#f3f4f6;
font-family:Arial,Helvetica,sans-serif;
">


<div style="
max-width:700px;
margin:30px auto;
background:white;
padding:40px;
border-radius:12px;
box-shadow:0 5px 20px rgba(0,0,0,0.08);
position:relative;
">



<!-- LOGO -->

<div style="
text-align:center;
margin-bottom:30px;
">

<div style="
width:120px;
height:60px;
margin:auto;
background:#ff7a00;
border-radius:10px;
display:flex;
align-items:center;
justify-content:center;
color:white;
font-size:28px;
font-weight:bold;
">

KINOVA

</div>


<p style="
color:#777;
font-size:14px;
">
Marketplace Kinova
</p>


</div>





<!-- CACHET STATUT -->

<div style="
position:absolute;
right:40px;
top:40px;
transform:rotate(-15deg);
border:3px solid ${statutCouleur};
color:${statutCouleur};
padding:12px 20px;
font-weight:bold;
font-size:14px;
border-radius:8px;
">

${statutTexte}

</div>







<h2 style="
color:#111827;
">

Merci pour votre commande

</h2>



<p>
Bonjour,
</p>


<p>
Votre commande a bien été enregistrée sur Kinova.
Voici le résumé de votre achat :
</p>





<hr style="
border:none;
border-top:1px solid #eee;
margin:30px 0;
">






<table width="100%" cellpadding="10" style="
border-collapse:collapse;
font-size:15px;
">


<tr style="
background:#f9fafb;
">

<td>
<strong>Numéro commande</strong>
</td>

<td>
${commande.numeroCommande}
</td>

</tr>



<tr>

<td>
<strong>Date</strong>
</td>

<td>
${new Date(commande.createdAt).toLocaleDateString()}
</td>

</tr>



<tr style="
background:#f9fafb;
">

<td>
<strong>Montant total</strong>
</td>

<td>
${commande.montantAPayer} ${commande.devise}
</td>

</tr>




<tr>

<td>
<strong>Moyen paiement</strong>
</td>

<td>
${commande.modePaiement}
</td>

</tr>




<tr style="
background:#f9fafb;
">

<td>
<strong>Opérateur</strong>
</td>

<td>
${commande.operateurPaiement}
</td>

</tr>



<tr>

<td>
<strong>Téléphone paiement</strong>
</td>

<td>
${commande.telephonePaiement}
</td>

</tr>



<tr style="
background:#f9fafb;
">

<td>
<strong>Statut paiement</strong>
</td>

<td style="
color:${statutCouleur};
font-weight:bold;
">

${statutTexte}

</td>

</tr>



<tr>

<td>
<strong>Statut commande</strong>
</td>

<td>
${commande.statutCommande}
</td>

</tr>


</table>






<hr style="
border:none;
border-top:1px solid #eee;
margin:30px 0;
">





<h3>
Articles commandés
</h3>


<table width="100%" cellpadding="10" style="
border-collapse:collapse;
">


<tr style="
background:#111827;
color:white;
">

<td>
Article
</td>

<td>
Quantité
</td>

<td>
Prix
</td>

</tr>



${
commande.articles.map(article => `


<tr style="
border-bottom:1px solid #eee;
">

<td>
${article.nom}
</td>


<td>
${article.quantite}
</td>


<td>
${article.prixFinal} ${commande.devise}
</td>


</tr>


`).join("")
}



</table>







<div style="
margin-top:40px;
padding:20px;
background:#fff7ed;
border-radius:10px;
color:#7c2d12;
">


<strong>Information paiement :</strong>

<br><br>


${
paiementConfirme
?
"Votre paiement a été confirmé. Votre commande sera préparée prochainement."
:
"Votre paiement est en attente de confirmation. Nous vous informerons dès validation."
}


</div>







<p style="
margin-top:40px;
font-size:14px;
color:#6b7280;
text-align:center;
">

Merci d'avoir choisi Kinova.

<br>

Equipe Kinova

</p>





</div>


</body>

</html>

`

        });



        console.log("Email commande envoyé");


    }
    catch(err){

        console.error(
            "Erreur envoi mail :",
            err.message
        );

    }

};

// =======================================
// CREER UNE COMMANDE + PAWAPAY
// =======================================

// =======================================
// CREER UNE COMMANDE + PAWAPAY
// =======================================

exports.creerCommande = async (req, res) => {

    try {

        const {

            utilisateurId,
            emailUtilisateur,

            articles,

            montantTotal,
            montantReduction,
            montantLivraison,
            montantAPayer,

            codePromo,

            modePaiement,
            operateurPaiement,

            telephonePaiement,

            adresseLivraison

        } = req.body;



        // ==============================
        // VALIDATION
        // ==============================

        if(
            !utilisateurId ||
            !emailUtilisateur ||
            !articles ||
            articles.length === 0
        ){

            return res.status(400).json({

                message:"Informations commande incomplètes"

            });

        }



        // ==============================
        // VERIFICATION DOUBLON
        // ==============================

        const commandeExistante = await Commande.findOne({

            utilisateurId,

            modePaiement:"MOBILE_MONEY",

            statutPaiement:{

                $in:[

                    "EN_ATTENTE",

                    "EN_COURS"

                ]

            }

        });



        if(commandeExistante){

            return res.status(200).json({

                message:
                "Une commande est déjà en cours de paiement",

                commande:commandeExistante

            });

        }





        // ==============================
        // CREATION NUMERO COMMANDE
        // ==============================

        const numeroCommande =
        "KINOVA-" + Date.now();





        // ==============================
        // CREATION COMMANDE
        // DEVise FORCEE USD
        // ==============================

        const commande = await Commande.create({

            numeroCommande,

            utilisateurId,

            emailUtilisateur,

            articles,


            montantTotal,

            montantReduction,

            montantLivraison,

            montantAPayer,


            // Toujours en USD
            devise:"USD",


            codePromo,


            modePaiement,

            operateurPaiement,


            telephonePaiement,


            adresseLivraison,


            statutPaiement:"EN_ATTENTE",

            statutCommande:"EN_ATTENTE"


        });






        // ==============================
        // PAWAPAY
        // ==============================

        if(modePaiement === "MOBILE_MONEY"){


            try{


                const paiement =
                await envoyerPaiementPawaPay(commande);




                // Sécurité si PawaPay refuse directement

                if(paiement.status === "REJECTED"){


                    await Commande.findByIdAndDelete(
                        commande._id
                    );


                    return res.status(400).json({

                        message:
                        paiement.failureReason?.failureMessage ||
                        "Paiement refusé"

                    });


                }





                commande.depositId =
                paiement.depositId;



                commande.statutPaiement =
                "EN_COURS";





                commande.metadata = {


                    ...commande.metadata,


                    pawapayStatus:
                    paiement.status || "ACCEPTED"


                };




                await commande.save();



            }


            catch(error){



                console.log(
                    "========== ERREUR PAWAPAY =========="
                );



                console.log(

                    error.response?.data ||
                    error.message

                );




                await Commande.findByIdAndDelete(
                    commande._id
                );




                return res.status(400).json({

                    message:
                    error.response?.data?.failureReason?.failureMessage ||
                    error.message ||
                    "Paiement impossible"

                });


            }



        }






        // ==============================
        // MAIL UNIQUEMENT SI TOUT OK
        // ==============================

        await envoyerMailCommande(commande);







        // ==============================
        // REPONSE
        // ==============================

        return res.status(201).json({

            message:"Commande créée",

            commande

        });



    }


    catch(error){



        console.log(

            "ERREUR CREATION COMMANDE :",

            error.message

        );



        return res.status(500).json({

            message:"Erreur serveur",

            error:error.message

        });



    }

};

// ADMIN : RÉCUPÉRER TOUTES LES COMMANDES
// =======================================

exports.getallCommandes = async (req,res)=>{

    try{

        const commandes = await Commande.find()
        .sort({
            createdAt:-1
        });


        res.status(200).json({

            total: commandes.length,

            commandes

        });


    }catch(error){

        res.status(500).json({

            message:"Erreur serveur",

            error:error.message

        });

    }

};


exports.updateStatutArticleCommande = async (req, res) => {

    try {

        const { id } = req.params;
        const { articleId, statutLivraison } = req.body;


        // Vérification statut
        const statutsAutorises = ["LIVRE", "NON_LIVRE"];

        if (!statutsAutorises.includes(statutLivraison)) {
            return res.status(400).json({
                message: "Statut livraison invalide"
            });
        }

        //Récupérer le vendeurId depuis le body (envoyé par le frontend)
        const vendeurId = req.body.vendeurId || req.user?.vendeurId || req.user?._id || req.user?.id;

        if (!vendeurId) {
            return res.status(400).json({
                message: "Vendeur non identifié"
            });
        }

        // Vérifier si la commande existe
        const commande = await Commande.findById(id);

        if (!commande) {
            return res.status(404).json({
                message: "Commande introuvable"
            });
        }

        // Trouver l'article correspondant au vendeur
        const article = commande.articles.find(
            item =>
                item.articleId.toString() === articleId &&
                item.vendeurId.toString() === vendeurId.toString()
        );


        if (!article) {
            return res.status(403).json({
                message: "Vous n'avez pas accès à cet article"
            });
        }

        // Modification du statut livraison
        article.statutLivraison = statutLivraison;

        await commande.save();

        console.log('✅ Statut mis à jour avec succès');

        res.status(200).json({
            message: "Statut livraison modifié avec succès",
            article: {
                articleId: article.articleId,
                nom: article.nom,
                statutLivraison: article.statutLivraison
            }
        });

    } catch(error) {
        console.error('❌ Erreur serveur détaillée:', error);
        res.status(500).json({
            message: "Erreur serveur",
            error: error.message,
            stack: error.stack
        });
    }

};

// =======================================
// RÉCUPÉRER UNE COMMANDE PAR ID
// =======================================

exports.getoneCommande = async (req, res) => {

    try {

        const { id } = req.params;


        const commande = await Commande.findById(id);



        if(!commande){

            return res.status(404).json({

                message:"Commande introuvable"

            });

        }



        return res.status(200).json({

            commande

        });



    } catch(error) {


        return res.status(500).json({

            message:"Erreur serveur",

            error:error.message

        });


    }

};

// =======================================
// VERIFIER PAIEMENT PAWAPAY
// =======================================
exports.verifierPaiement = async(req,res)=>{

    try{


        const commande = await Commande.findById(
            req.params.id
        );


        if(!commande){

            return res.status(404).json({

                message:"Commande introuvable"

            });

        }



        const response = await axios.get(

            `https://api.sandbox.pawapay.io/v2/deposits/${commande.depositId}`,

            {

                headers:{

                    Authorization:
                    `Bearer ${process.env.PAWAPAY_TOKEN}`

                }

            }

        );



        const paiement = response.data.data;




        // Mise à jour du statut réel venant de pawaPay

        commande.metadata = {

            ...commande.metadata,

            pawapayStatus: paiement.status

        };





        // Paiement terminé

        if(paiement.status === "COMPLETED"){


            commande.statutPaiement = "PAYE";


            commande.statutCommande = "CONFIRMEE";


            commande.providerTransactionId =
            paiement.providerTransactionId;


        }





        // Paiement échoué

        if(paiement.status === "FAILED"){


            commande.statutPaiement = "ECHEC";


        }





        await commande.save();





        res.json({

            message:"Paiement vérifié",

            paiement,

            commande

        });





    }catch(error){


        console.log(

            "Erreur vérification paiement :",

            error.response?.data ||
            error.message

        );



        res.status(500).json({

            message:"Erreur vérification paiement",

            error:error.message

        });


    }


};
// =======================================
// COMMANDES UTILISATEUR
// =======================================
exports.getCommandesUtilisateur = async(req,res)=>{


    try{


        const { utilisateurId } =
        req.params;




        const commandes =
        await Commande.find({

            utilisateurId

        })
        .sort({

            createdAt:-1

        });




        res.json(commandes);




    }catch(error){



        res.status(500).json({

            message:"Erreur serveur",

            error:error.message

        });



    }


};
// =======================================
// UNE COMMANDE PAR ID
// =======================================
exports.getCommandeById = async(req,res)=>{


    try{


        const commande =
        await Commande.findById(

            req.params.id

        );




        if(!commande){


            return res.status(404).json({

                message:"Commande introuvable"

            });


        }




        res.json(commande);




    }catch(error){



        res.status(500).json({

            message:"Erreur serveur",

            error:error.message

        });



    }


};

// =======================================
// MODIFIER STATUT COMMANDE
// =======================================
exports.updateStatutCommande = async(req,res)=>{


    try{


        const {

            statutCommande,

            statutPaiement


        } = req.body;





        const commande =
        await Commande.findByIdAndUpdate(


            req.params.id,


            {


                statutCommande,

                statutPaiement


            },


            {


                new:true


            }


        );





        if(!commande){


            return res.status(404).json({

                message:"Commande introuvable"

            });


        }





        res.json({


            message:"Commande mise à jour",


            commande


        });




    }catch(error){



        res.status(500).json({


            message:"Erreur serveur",


            error:error.message


        });



    }


};