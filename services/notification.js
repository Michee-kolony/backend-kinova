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


    return admin.messaging().send(message);

};