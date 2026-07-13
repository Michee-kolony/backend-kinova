const Token = require("../models/firebase");
const {getRandomArticle} = require("./randomArticle");
const {sendNotification} = require("./notification");

exports.sendRandomArticle = async ()=>{

    const article = await getRandomArticle();

    if(!article){

        return;

    }

    const tokens = await Token.find();

    for(const device of tokens){

        await sendNotification(device.token, article);

    }

}