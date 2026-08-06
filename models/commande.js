const mongoose = require("mongoose");

const commandeArticleSchema = new mongoose.Schema(
{
    articleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Article",
        required: true
    },

    nom: {
        type: String,
        required: true
    },

    prix: {
        type: Number,
        required: true
    },

    reduction: {
        type: Number,
        default: 0
    },

    prixreduit: {
        type: Number,
        default: 0
    },

    prixFinal: {
        type: Number,
        required: true
    },

    quantite: {
        type: Number,
        required: true
    },

    //Nouveau : statut de livraison de chaque article
    statutLivraison: {
        type: String,
        enum: [
            "NON_LIVRE",
            "LIVRE"
        ],
        default: "NON_LIVRE"
    },

    categorie: String,

    genre: String,

    description: String,

    images: [String],

    couleurChoisie: String,

    tailleChoisie: String,

    vendeurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Utilisateur",
        required: true
    },

    vendeurNom: String,

    vendeurTelephone: String

},
{
    _id: false
}
);

const commandeSchema = new mongoose.Schema(
{

    numeroCommande:{

        type:String,

        unique:true,

        required:true

    },

    utilisateurId:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"Utilisateur",

        required:true

    },

    // ✅ Nouveau : email de l'utilisateur ayant passé la commande
    emailUtilisateur:{

        type:String,

        required:true,

        lowercase:true,

        trim:true

    },

    articles:[commandeArticleSchema],

    montantTotal:{

        type:Number,

        required:true

    },

    montantReduction:{

        type:Number,

        default:0

    },

    montantLivraison:{

        type:Number,

        default:0

    },

    montantAPayer:{

        type:Number,

        required:true

    },

    devise:{

        type:String,

        enum:["CDF"],

        default:"CDF"

    },

    codePromo:{

        type:String,

        default:null

    },

    modePaiement:{

        type:String,

        enum:[

            "MOBILE_MONEY",

            "CARTE",

            "ESPECES"

        ],

        default:"MOBILE_MONEY"

    },

    operateurPaiement:{

        type:String,

        enum:[

            "VODACOM_MPESA_COD",

            "AIRTEL_COD",

            "ORANGE_COD"

        ],

        default:"VODACOM_MPESA_COD"

    },

    telephonePaiement:{

        type:String,

        required:true

    },

    // ID envoyé à PawaPay
    depositId:{

        type:String,

        default:null

    },

    // ID retourné par l'opérateur
    providerTransactionId:{

        type:String,

        default:null

    },

    statutPaiement:{

        type:String,

        enum:[

            "EN_ATTENTE",

            "EN_COURS",

            "ACCEPTE",

            "PAYE",

            "ECHEC",

            "ANNULE",

            "REMBOURSE"

        ],

        default:"EN_ATTENTE"

    },

    statutCommande:{

        type:String,

        enum:[

            "EN_ATTENTE",

            "CONFIRMEE",

            "EN_PREPARATION",

            "EXPEDIEE",

            "LIVREE",

            "ANNULEE"

        ],

        default:"EN_ATTENTE"

    },

    adresseLivraison:{

        type:mongoose.Schema.Types.Mixed,

        default:null

    },

    metadata:{

        type:mongoose.Schema.Types.Mixed,

        default:{}

    }

},
{

    timestamps:true

}
);

module.exports = mongoose.model(
    "Commande",
    commandeSchema
);