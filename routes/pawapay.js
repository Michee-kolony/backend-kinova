const express = require("express");
const router = express.Router();

const {
    webhookPawaPay
} = require("../controllers/pawapay");


router.post(
    "/webhook",
    webhookPawaPay
);


module.exports = router;