const Categorie = require('../models/categorie');


exports.createCategorie = (req, res, next)=>{

    const categorie = new Categorie({
        ...req.body
    })

    categorie.save()
             .then(()=>res.status(200).json({message: "Catégorie ajoutée"}))
              .catch(error=>res.status(500).json(error))

}

exports.getCategorie = (req, res, next) => {

    Categorie.find()
             .then(data=>res.status(200).json(data))
             .catch(error=>res.status(500).json(error))

}

exports.supprimerCategorie = (req, res, next)=>{
    Categorie.deleteOne({_id:req.params.id})
              .then(()=>res.status(200).json({message: "Catégorie supprimée"}))
              .catch(error=>res.status(500).json(error))
 
}