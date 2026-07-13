const Article = require("../models/article");

exports.getRandomArticle = async ()=>{

    const articles = await Article.find();

    if(articles.length === 0){

        return null;

    }

    const index = Math.floor(Math.random()*articles.length);

    return articles[index];

}