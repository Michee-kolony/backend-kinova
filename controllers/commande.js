const Commande = require("../models/commande");
const envoyerPaiementPawaPay = require("../services/pawapay");
const axios = require("axios");
const transporter = require("../config/mail");


//Fonction d'envoie MAIL
const envoyerMailCommande = async (commande) => {
    try {

        const statut =
            commande.statutPaiement === "PAYE"
                ? "Paiement confirmé"
                : "Paiement non confirmé";

        await transporter.sendMail({

            from: `"Kinova" <${process.env.SMTP_USER}>`,

            to: commande.emailUtilisateur,

            subject: `Votre commande ${commande.numeroCommande}`,

            html: `
                <h2>Merci pour votre commande.</h2>

                <p><strong>Numéro :</strong> ${commande.numeroCommande}</p>

                <p><strong>Montant :</strong> ${commande.montantAPayer} ${commande.devise}</p>

                <p><strong>Mode de paiement :</strong> ${commande.modePaiement}</p>

                <p><strong>Opérateur :</strong> ${commande.operateurPaiement}</p>

                <p><strong>Téléphone :</strong> ${commande.telephonePaiement}</p>

                <p><strong>Statut paiement :</strong> ${statut}</p>

                <p><strong>Statut commande :</strong> ${commande.statutCommande}</p>

                <br>

                <p>Merci de votre confiance.</p>

                <b>Equipe Kinova</b>
            `

        });

    } catch (err) {

        console.error("Erreur envoi mail :", err.message);

    }
};

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

            devise,
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
        // CREATION COMMANDE MONGODB
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



            devise,

            codePromo,



            modePaiement,

            operateurPaiement,



            telephonePaiement,



            adresseLivraison,



            statutPaiement:"EN_ATTENTE",


            statutCommande:"EN_ATTENTE"


        });








        // ==============================
        // APPEL PAWAPAY
        // ==============================


        if(modePaiement === "MOBILE_MONEY"){


            try{


                const paiement =
                await envoyerPaiementPawaPay(commande);





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



                commande.statutPaiement =
                "ECHEC";




                commande.metadata = {


                    ...commande.metadata,


                    pawapayError:
                    error.response?.data ||
                    error.message


                };




                await commande.save();


            }



        }






        // ==============================
        // ENVOI MAIL CLIENT
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