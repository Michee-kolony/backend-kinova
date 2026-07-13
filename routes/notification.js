const express = require("express");
const router = express.Router();

const Token = require("../models/firebase");


router.post("/token", async (req,res)=>{

    try {

        const {token} = req.body;


        if(!token){

            return res.status(400).json({
                message:"Token manquant"
            });

        }


        // Vérifier si le token existe déjà
        const existingToken = await Token.findOne({
            token: token
        });


        if(existingToken){

            return res.status(200).json({

                message:"Token déjà enregistré",
                data: existingToken

            });

        }


        const newToken = new Token({

            token: token

        });


        const savedToken = await newToken.save();


        res.status(201).json({

            message:"Token enregistré",
            data:savedToken

        });


    } catch(error){

        res.status(500).json({

            message:"Erreur serveur",
            error:error.message

        });

    }


});


module.exports = router;