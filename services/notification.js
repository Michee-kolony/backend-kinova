const admin = require("../config/firebase");

exports.sendNotification = async (token, article) => {

    const image =
        article.images && article.images.length > 0
            ? article.images[0]
            : "";

    const message = {

        token,

        notification: {
            title: article.nom,
            body: article.description
        },

        android: {
            notification: {
                imageUrl: image
            }
        },

        apns: {
            fcmOptions: {
                image: image
            }
        },

        data: {
            articleId: article._id.toString(),
            nom: article.nom,
            image: image
        }

    };

    return admin.messaging.send(message);
};