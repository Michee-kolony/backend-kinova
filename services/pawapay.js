const axios = require("axios");
const { randomUUID } = require("crypto");


const envoyerPaiementPawaPay = async (commande) => {


    const depositId = commande.depositId || randomUUID();


    const telephone = commande.telephonePaiement
        .replace("+", "")
        .replace(/\s/g, "");



    const payload = {


        depositId,


        payer:{


            type:"MMO",


            accountDetails:{


                phoneNumber:telephone,


                provider:commande.operateurPaiement


            }


        },


        amount:String(commande.montantAPayer),


        currency:commande.devise,


        customerMessage:"Paiement Kinova",


        clientReferenceId:commande.numeroCommande,


        metadata:[


            {

                orderId:commande.numeroCommande

            },


            {

                customerId:String(commande.utilisateurId)

            }


        ]


    };



    try{


        const response = await axios.post(


            `${process.env.PAWAPAY_API_URL}/deposits`,


            payload,


            {


                headers:{


                    Authorization:
                    `Bearer ${process.env.PAWAPAY_TOKEN}`,


                    "Content-Type":"application/json",


                    Accept:"application/json"


                }


            }


        );



        console.log(
            "========== PAWAPAY RESPONSE =========="
        );


        console.log(response.data);



        return {


            depositId,


            status:response.data.status,


            providerTransactionId:
            response.data.providerTransactionId || null,


            data:response.data


        };



    }catch(error){



        console.log(
            "========== PAWAPAY ERROR =========="
        );


        console.log(

            error.response?.data ||
            error.message

        );


        console.log(
            "====================================="
        );



        throw error;


    }


};



module.exports = envoyerPaiementPawaPay;