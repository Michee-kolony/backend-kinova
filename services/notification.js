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


        // iOS avec image (Notification Service Extension nécessaire)
        message.apns = {
            payload: {
                aps: {
                    alert: {
                        title: article.nom,
                        body: article.description
                    },
                    sound: "default",
                    "mutable-content": 1
                }
            },
            fcmOptions: {
                imageUrl: imageUrl
            }
        };


        // Envoyer aussi l'URL dans les données
        message.data.image = imageUrl;

    } else {

        // iOS sans image si aucune image disponible
        message.apns = {
            payload: {
                aps: {
                    sound: "default"
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