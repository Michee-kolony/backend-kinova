const express = require("express");
const router = express.Router();

const Token = require("../models/firebase");


router.post("/token",(req,res)=>{


    const newToken = new Token({

        token:req.body.token

    });


    newToken.save()

    .then(data=>{

        res.status(201).json({
            message:"Token enregistré",
            data
        });

    })

    .catch(error=>{

        res.status(500).json(error);

    });


});


module.exports = router;