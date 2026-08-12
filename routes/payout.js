const express = require("express");

const router = express.Router();

const {
    effectuerPayoutVendeur,
    getTousLesPayouts,
    getPayoutById
} = require("../controllers/payout");


// ======================================================
// EFFECTUER PAYOUT MANUEL
// ======================================================

router.post(
    "/vendeur",
    effectuerPayoutVendeur
);


// ======================================================
// LISTE DE TOUS LES PAYOUTS
// ======================================================

router.get(
    "/",
    getTousLesPayouts
);


// ======================================================
// DETAIL D'UN PAYOUT
// ======================================================

router.get(
    "/:id",
    getPayoutById
);


module.exports = router;