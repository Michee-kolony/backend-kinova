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

    try {

        const response = await admin.messaging().send(message);

        console.log("✅ Notification envoyée :", response);

        return response;

    } catch (error) {

        console.error("❌ Erreur Firebase :", error);

        throw error;

    }

};