
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

        // Android
        message.android = {
            notification: {
                imageUrl: imageUrl
            }
        };

        // iOS
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

        // URL de l'image dans les données
        message.data.image = imageUrl;
    }

    return messaging.send(message);
};
