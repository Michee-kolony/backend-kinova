const axios = require("axios");
const { randomUUID } = require("crypto");


const envoyerPayoutPawaPay = async ({

    telephone,
    operateur,
    montant,
    devise,
    numeroCommande,
    vendeurId

}) => {

    const payoutId = randomUUID();


    const telephoneNormalise =
        String(telephone)
            .replace(/\+/g, "")
            .replace(/\s/g, "")
            .replace(/-/g, "");


    const payload = {

        payoutId,

        recipient: {

            type: "MMO",

            accountDetails: {

                phoneNumber:
                    telephoneNormalise,

                provider:
                    operateur

            }

        },

        amount:
            String(montant),

        currency:
            devise,

        clientReferenceId:
            numeroCommande,

        metadata: [

            {
                orderId:
                    numeroCommande
            },

            {
                vendorId:
                    String(vendeurId)
            }

        ]

    };


    console.log(
        "======================================"
    );

    console.log(
        "========== PAWAPAY PAYOUT ============="
    );

    console.log(
        JSON.stringify(
            payload,
            null,
            2
        )
    );

    console.log(
        "======================================"
    );


    try {

        const response =
            await axios.post(

                `${process.env.PAWAPAY_API_URL}/payouts`,

                payload,

                {

                    headers: {

                        Authorization:
                            `Bearer ${process.env.PAWAPAY_TOKEN}`,

                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json"

                    }

                }

            );


        console.log(
            "======================================"
        );

        console.log(
            "========== PAWAPAY RESPONSE ==========="
        );

        console.log(
            JSON.stringify(
                response.data,
                null,
                2
            )
        );

        console.log(
            "======================================"
        );


        return {

            payoutId,

            status:
                response.data.status ||
                "ACCEPTED",

            providerTransactionId:
                response.data.providerTransactionId ||
                null,

            data:
                response.data

        };

    }
    catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "❌ PAWAPAY PAYOUT ERROR"
        );

        console.error(
            JSON.stringify(
                error.response?.data ||
                error.message,
                null,
                2
            )
        );

        console.error(
            "======================================"
        );


        throw error;

    }

};


module.exports =
    envoyerPayoutPawaPay;