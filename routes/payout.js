const express = require("express");

const router = express.Router();

const {
    effectuerPayoutVendeur,
    getTousLesPayouts
} = require("../controllers/payout");

router.post(
    "/vendeur",
    effectuerPayoutVendeur
);

router.get(
    "/",
    getTousLesPayouts
);

module.exports = router;