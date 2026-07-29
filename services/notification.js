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
    },

    // Configuration iOS sans image
    apns: {
        payload: {
            aps: {
                sound: "default",
                badge: 1
            }
        }
    },

    // Android garde l'image si disponible
    android: {}
};

// Ajouter l'image uniquement pour Android
if (
    article.images &&
    Array.isArray(article.images) &&
    article.images.length > 0 &&
    article.images[0].startsWith("http")
) {
    const imageUrl = encodeURI(article.images[0]);

    message.android = {
        notification: {
            imageUrl: imageUrl
        }
    };

    // Pas d'image pour iOS
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
