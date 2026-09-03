const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const path = require("path");
//mes  routes
const routeClient = require('./routes/client');
const routeAdministrateur = require('./routes/administrateur');
const routeCategorie = require('./routes/categorie');
const routeArticle = require('./routes/article');
const {sendRandomArticle} = require("./services/sendRandomNotification");
const cron = require("node-cron");
const notificationRoutes = require("./routes/notification");
const panierRoute = require('./routes/panier');
const vendeurRoute = require('./routes/vendeur');
const messageRoute = require('./routes/messages');
const routeCommande = require('./routes/commande');
const pawapayRoute = require("./routes/pawapay");
const payoutRoutes = require("./routes/payout");
const livreurRoute = require('./routes/livreur');
const livraisonRoute = require('./routes/livraison');

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
app.use(
    "/images",
    express.static(
        path.join(__dirname, "public")
    )
);

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
app.use('/vendeur', vendeurRoute);
app.use('/messages', messageRoute);
app.use('/commandes', routeCommande);
app.use("/pawapay", pawapayRoute);
app.use("/payout", payoutRoutes);
app.use('/livreur', livreurRoute);
app.use('/livraison', livraisonRoute);

// Gestionnaire d'erreurs global : évite de renvoyer une page HTML brute
// (ex: timeout réseau vers R2) et renvoie du JSON exploitable par le client
app.use((err, req, res, next) => {
  console.error("❌ Erreur non gérée :", err);
  res.status(500).json({
    success: false,
    message: "Une erreur interne est survenue",
    error: err.message
  });
});

module.exports = app;