const admin = require("../config/firebase");


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


    // Ajouter l'image seulement si elle existe
    if (
        article.images &&
        Array.isArray(article.images) &&
        article.images.length > 0 &&
        article.images[0].startsWith("http")
    ) {

        message.android = {

            notification: {

                imageUrl: encodeURI(article.images[0])

            }

        };


        message.data.image = encodeURI(article.images[0]);

    }


    return admin.messaging().send(message);

};