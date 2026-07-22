const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

//mes  routes
const routeClient = require('./routes/client');
const routeAdministrateur = require('./routes/administrateur');
const routeCategorie = require('./routes/categorie');
const routeArticle = require('./routes/article');
const {sendRandomArticle} = require("./services/sendRandomNotification");
const cron = require("node-cron");
const notificationRoutes = require("./routes/notification");
const panierRoute = require('./routes/panier');

mongoose.connect(
  'mongodb://micheekolony71%40gmail.com:1708roosevelt@187.55.225.170:27017/kinova?authSource=admin',
  {
    serverSelectionTimeoutMS: 5000
  }
)
.then(() => {
  console.log('Connecté à MongoDB sur le VPS');
})
.catch((err) => {
  console.error('Erreur de connexion à MongoDB sur le VPS');
  console.error(err);
});


cron.schedule("0 */2 * * *", async ()=>{

    console.log("Envoi d'une notification...");

    await sendRandomArticle();

});

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res, next) => {
  res.status(200).json({
    message: "API Kinova fonctionne correctement"
  });
});

//Déclaration de mes endpoints
app.use('/client', routeClient);
app.use('/auth', routeAdministrateur);
app.use('/categorie', routeCategorie);
app.use('/article', routeArticle);
app.use("/notification", notificationRoutes);
app.use('/panier', panierRoute);





module.exports = app;