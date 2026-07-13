const { initializeApp, cert } = require("firebase-admin/app");

const serviceAccount = require("../kinova-e15c4-firebase-adminsdk-fbsvc-b1b60a0e2d.json");


initializeApp({
    credential: cert(serviceAccount)
});


module.exports = require("firebase-admin");