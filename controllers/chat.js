const mongoose = require("mongoose");
const Conversation = require("../models/conversation");
const ChatMessage = require("../models/chatMessage");
const Article = require("../models/article");
const Vendeur = require("../models/vendeur");
require("../models/client"); // pour populate("client")
const Token = require("../models/firebase");
const { uploadImages, deleteImages } = require("../services/r2Images");
const { notifierNouveauMessage } = require("../services/chatNotification");

const TEXTE_MAX = 2000;

const autreRole = role => role === "client" ? "vendeur" : "client";

const salle = (role, id) => `chat:${role}:${id}`;
exports.salle = salle;

const valideId = id => mongoose.Types.ObjectId.isValid(id);

function erreur(res, status, message) {
    return res.status(status).json({ success: false, message });
}

// Vue d'une conversation du point de vue de l'utilisateur connecté
function formaterConversation(conv, role) {

    const autre = role === "client" ? conv.vendeur : conv.client;

    return {
        _id: conv._id,
        interlocuteur: autre ? {
            id: autre._id,
            nom: role === "client" ? autre.storeName : autre.name,
            telephone: role === "client" ? autre.phoneNumber : autre.telephone,
            verifie: role === "client" ? !!autre.isVerified : undefined
        } : null,
        article: conv.article?.id ? conv.article : null,
        dernierMessage: conv.dernierMessage || null,
        nonLus: conv.nonLus?.[role] || 0,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt
    };
}

const POPULATE = [
    { path: "client", select: "name telephone" },
    { path: "vendeur", select: "storeName phoneNumber isVerified" }
];

// Vérifie que l'utilisateur participe à la conversation
async function chargerConversation(req, res) {

    if (!valideId(req.params.id)) {
        erreur(res, 404, "Conversation introuvable");
        return null;
    }

    const conv = await Conversation.findById(req.params.id);

    if (!conv || String(conv[req.chatUser.role]) !== req.chatUser.id) {
        erreur(res, 404, "Conversation introuvable");
        return null;
    }

    return conv;
}

// Enregistre un message, met à jour la conversation, prévient le destinataire
async function publierMessage(req, conv, donnees) {

    const { id, role } = req.chatUser;
    const destinataire = autreRole(role);

    const message = await ChatMessage.create({
        conversation: conv._id,
        auteur: role,
        auteurId: id,
        ...donnees
    });

    const maj = {
        $set: {
            dernierMessage: {
                texte: message.type === "produit" ? message.article?.nom : message.texte,
                type: message.type,
                auteur: role,
                date: message.createdAt
            },
            "masque.client": false,
            "masque.vendeur": false
        },
        $inc: { [`nonLus.${destinataire}`]: 1 }
    };

    if (message.type === "produit") maj.$set.article = message.article;

    const convMaj = await Conversation.findByIdAndUpdate(conv._id, maj, { returnDocument: "after" }).populate(POPULATE);

    const io = req.app.get("io");

    if (io) {
        for (const r of ["client", "vendeur"]) {
            io.to(salle(r, convMaj[r]._id)).emit("chat:message", {
                conversation: formaterConversation(convMaj, r),
                message
            });
        }
    }

    const expediteur = role === "client" ? convMaj.client : convMaj.vendeur;

    notifierNouveauMessage({
        destinataireId: convMaj[destinataire]._id,
        destinataireRole: destinataire,
        expediteurNom: (role === "client" ? expediteur?.name : expediteur?.storeName) || "Kinova",
        conversationId: conv._id,
        message
    });

    return { message, conversation: convMaj };
}

function carteProduit(article) {
    return {
        id: article._id,
        nom: article.nom,
        prix: article.prix,
        prixreduit: article.prixreduit,
        image: article.images?.[0] || null
    };
}

// ==========================================
// CLIENT : contacter un vendeur (depuis un produit ou sa boutique)
// ==========================================
exports.demarrerConversation = async (req, res) => {

    try {

        if (req.chatUser.role !== "client") {
            return erreur(res, 403, "Seuls les clients peuvent démarrer une conversation");
        }

        const { articleId } = req.body;
        let { vendeurId } = req.body;
        let article = null;

        if (articleId) {
            if (!valideId(articleId) || !(article = await Article.findById(articleId))) {
                return erreur(res, 404, "Article introuvable");
            }
            vendeurId = article.vendeurId;
        }

        if (!vendeurId || !valideId(vendeurId) || !(await Vendeur.exists({ _id: vendeurId }))) {
            return erreur(res, 404, "Vendeur introuvable");
        }

        const trouverOuCreer = () => Conversation.findOneAndUpdate(
            { client: req.chatUser.id, vendeur: vendeurId },
            { $set: { "masque.client": false } },
            { upsert: true, returnDocument: "after" }
        );

        let conv;
        try {
            conv = await trouverOuCreer();
        } catch (e) {
            // Double appui simultané : l'autre requête vient de la créer
            if (e.code !== 11000) throw e;
            conv = await trouverOuCreer();
        }

        // Carte produit envoyée si le client parle d'un nouvel article
        if (article && String(conv.article?.id) !== String(article._id)) {
            const resultat = await publierMessage(req, conv, { type: "produit", article: carteProduit(article) });
            conv = resultat.conversation;
        } else {
            conv = await conv.populate(POPULATE);
        }

        res.status(200).json(formaterConversation(conv, "client"));

    } catch (error) {
        console.log(error);
        erreur(res, 500, error.message);
    }
};

// ==========================================
// LISTE DES CONVERSATIONS
// ==========================================
exports.listerConversations = async (req, res) => {

    try {

        const { id, role } = req.chatUser;

        const conversations = await Conversation
            .find({ [role]: id, [`masque.${role}`]: { $ne: true }, dernierMessage: { $exists: true } })
            .sort({ updatedAt: -1 })
            .limit(200)
            .populate(POPULATE);

        res.status(200).json(conversations.map(c => formaterConversation(c, role)));

    } catch (error) {
        console.log(error);
        erreur(res, 500, error.message);
    }
};

exports.getConversation = async (req, res) => {

    try {

        const conv = await chargerConversation(req, res);
        if (!conv) return;

        await conv.populate(POPULATE);
        res.status(200).json(formaterConversation(conv, req.chatUser.role));

    } catch (error) {
        console.log(error);
        erreur(res, 500, error.message);
    }
};

// ==========================================
// NOMBRE TOTAL DE MESSAGES NON LUS (badge)
// ==========================================
exports.compterNonLus = async (req, res) => {

    try {

        const { id, role } = req.chatUser;

        const [resultat] = await Conversation.aggregate([
            { $match: { [role]: new mongoose.Types.ObjectId(id), [`masque.${role}`]: { $ne: true } } },
            { $group: { _id: null, total: { $sum: `$nonLus.${role}` } } }
        ]);

        res.status(200).json({ total: resultat?.total || 0 });

    } catch (error) {
        console.log(error);
        erreur(res, 500, error.message);
    }
};

// ==========================================
// MESSAGES D'UNE CONVERSATION (pagination : ?avant=<id du plus ancien message>&limite=30)
// ==========================================
exports.listerMessages = async (req, res) => {

    try {

        const conv = await chargerConversation(req, res);
        if (!conv) return;

        const limite = Math.min(parseInt(req.query.limite) || 30, 100);
        const filtre = { conversation: conv._id };

        if (req.query.avant && valideId(req.query.avant)) {
            filtre._id = { $lt: req.query.avant };
        }

        const messages = await ChatMessage.find(filtre).sort({ _id: -1 }).limit(limite + 1);

        res.status(200).json({
            messages: messages.slice(0, limite).reverse(),
            aPlus: messages.length > limite
        });

    } catch (error) {
        console.log(error);
        erreur(res, 500, error.message);
    }
};

// ==========================================
// ENVOYER UN MESSAGE (texte JSON ou photo multipart "image")
// ==========================================
exports.envoyerMessage = async (req, res) => {

    let images = [];

    try {

        const conv = await chargerConversation(req, res);
        if (!conv) return;

        const texte = (req.body.texte || "").trim();

        if (texte.length > TEXTE_MAX) {
            return erreur(res, 400, `Message trop long (${TEXTE_MAX} caractères maximum)`);
        }

        let donnees;

        if (req.files && req.files.length) {
            images = await uploadImages(req.files.slice(0, 1), "chat");
            donnees = { type: "image", image: images[0], texte: texte || undefined };
        } else if (texte) {
            donnees = { type: "texte", texte };
        } else {
            return erreur(res, 400, "Le message est vide");
        }

        const { message } = await publierMessage(req, conv, donnees);

        res.status(201).json(message);

    } catch (error) {
        console.log(error);
        await deleteImages(images);
        erreur(res, error.status || 500, error.message);
    }
};

// ==========================================
// MARQUER COMME LU (accusé de lecture)
// ==========================================
exports.marquerLu = async (req, res) => {

    try {

        const conv = await chargerConversation(req, res);
        if (!conv) return;

        const { role } = req.chatUser;
        const luLe = new Date();

        const resultat = await ChatMessage.updateMany(
            { conversation: conv._id, auteur: autreRole(role), lu: false },
            { $set: { lu: true, luLe } }
        );

        await Conversation.updateOne({ _id: conv._id }, { $set: { [`nonLus.${role}`]: 0 } });

        if (resultat.modifiedCount > 0) {
            req.app.get("io")?.to(salle(autreRole(role), conv[autreRole(role)])).emit("chat:lu", {
                conversationId: conv._id,
                luLe
            });
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.log(error);
        erreur(res, 500, error.message);
    }
};

// ==========================================
// SUPPRIMER UNE CONVERSATION DE SA LISTE
// Effacée définitivement (avec ses photos) quand les deux l'ont supprimée
// ==========================================
exports.supprimerConversation = async (req, res) => {

    try {

        const conv = await chargerConversation(req, res);
        if (!conv) return;

        const { role } = req.chatUser;

        conv.masque[role] = true;
        conv.nonLus[role] = 0;

        if (conv.masque[autreRole(role)]) {
            const avecImages = await ChatMessage.find({ conversation: conv._id, type: "image" }).select("image");
            await deleteImages(avecImages.map(m => m.image));
            await ChatMessage.deleteMany({ conversation: conv._id });
            await conv.deleteOne();
        } else {
            await conv.save();
        }

        res.status(200).json({ success: true, message: "Conversation supprimée" });

    } catch (error) {
        console.log(error);
        erreur(res, 500, error.message);
    }
};

// ==========================================
// LIER LE TOKEN DE NOTIFICATION DE L'APPAREIL À L'UTILISATEUR
// ==========================================
exports.enregistrerPushToken = async (req, res) => {

    try {

        const { token } = req.body;
        if (!token) return erreur(res, 400, "Token manquant");

        await Token.findOneAndUpdate(
            { token },
            { $set: { userId: req.chatUser.id, role: req.chatUser.role } },
            { upsert: true }
        );

        res.status(200).json({ success: true });

    } catch (error) {
        console.log(error);
        erreur(res, 500, error.message);
    }
};
