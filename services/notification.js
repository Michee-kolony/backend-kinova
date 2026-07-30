
const { messaging } = require("../config/firebase");

exports.sendNotification = async (token, article) => {

    const message = {
        token: token,

        notification: {
            title: article.nom,
            body: article.description
        },

        data: {
            articleId: article._id.toString()
        }
    };


    // Ajouter l'image si elle existe
    if (
        article.images &&
        Array.isArray(article.images) &&
        article.images.length > 0 &&
        article.images[0].startsWith("http")
    ) {

        const imageUrl = encodeURI(article.images[0]);


        // Android avec image
        message.android = {
            notification: {
                imageUrl: imageUrl
            }
        };


        // iOS avec Notification Service Extension
        message.apns = {
            payload: {
                aps: {
                    alert: {
                        title: article.nom,
                        body: article.description
                    },
                    sound: "default",
                    badge: 1,
                    "mutable-content": 1
                }
            }
        };

        message.data.imageUrl = imageUrl;


    } else {

        // iOS sans image
        message.apns = {
            payload: {
                aps: {
                    sound: "default",
                    badge: 1
                }
            }
        };

    }


    try {

        const response = await messaging.send(message);

        console.log("Notification envoyée :", response);

        return response;


    } catch (error) {

        console.log("Erreur envoi notification :", error);

        throw error;
    }

};