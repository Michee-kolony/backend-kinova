const Message = require('../models/messages');


exports.sendMessage = async (req, res) => {
    try {
        const message = new Message({
            ...req.body
        });

        const savedMessage = await message.save();

        res.status(201).json({
            success: true,
            message: "Message envoyé avec succès",
            data: savedMessage
        });

    } catch (error) {
        console.error("Erreur lors de l'envoi du message :", error);

        res.status(500).json({
            success: false,
            message: "Erreur lors de l'envoi du message",
            error: error.message
        });
    }
};

exports.getMessage = (req, res)=>{

    Message.find()
           .then(data=>res.status(200).json(data))
           .catch(error=>res.status(500).json(error))

}


exports.getoneMessage = (req, res) => {
    Message.findOne({ _id: req.params.id })
        .then(data => {
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Message introuvable"
                });
            }

            res.status(200).json({
                success: true,
                data: data
            });
        })
        .catch(error => {
            res.status(500).json({
                success: false,
                message: "Erreur lors de la récupération du message",
                error: error.message
            });
        });
};


exports.deleteMessage = (req, res)=>{

    Message.deleteOne({_id:req.params.id})
           .then(()=>res.status(200).json({message: "Message supprimé avec succès"}))
           .catch(error=>res.status(500).json(error))

}