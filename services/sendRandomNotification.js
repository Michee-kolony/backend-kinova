const Token = require("../models/firebase");
const { getRandomArticle } = require("./randomArticle");
const { sendNotification } = require("./notification");

exports.sendRandomArticle = async () => {

    const article = await getRandomArticle();

    if (!article) {
        console.log("Aucun article trouvé.");
        return;
    }

    const tokens = await Token.find();

    console.log(`📱 ${tokens.length} appareil(s) trouvé(s).`);

    for (const device of tokens) {

        try {

            await sendNotification(device.token, article);

        } catch (error) {

            console.error(`Erreur pour le token ${device.token}:`, error.message);

        }

    }

};