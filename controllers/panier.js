const Panier = require('../models/panier');

// ==================== GET ====================
exports.creerPanier = (req, res) => {
  const { utilisateurId } = req.body;

  Panier.findOne({ utilisateurId, statut: 'actif' })
    .then(panierExistant => {
      if (panierExistant) {
        return res.status(400).json({
          success: false,
          message: 'Un panier actif existe déjà pour cet utilisateur',
          data: panierExistant
        });
      }

      const nouveauPanier = new Panier({
        utilisateurId,
        articles: [],
        codePromo: null,
        statut: 'actif'
      });

      return nouveauPanier.save();
    })
    .then(panierCree => {
      return res.status(201).json({
        success: true,
        message: 'Panier créé avec succès',
        data: panierCree
      });
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du panier',
        error: error.message
      });
    });
};

// ==================== GET ====================
exports.getPanier = (req, res) => {
  const { utilisateurId } = req.params;

  Panier.findOne({ utilisateurId, statut: 'actif' })
    .then(panier => {
      if (!panier) {
        const nouveauPanier = new Panier({
          utilisateurId,
          articles: [],
          codePromo: null,
          statut: 'actif'
        });
        return nouveauPanier.save();
      }
      return panier;
    })
    .then(panier => {
      return res.status(200).json({
        success: true,
        message: 'Panier récupéré avec succès',
        data: panier
      });
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du panier',
        error: error.message
      });
    });
};

// ==================== POST - AJOUTER ARTICLE ====================
// ⭐⭐⭐ VERSION CORRIGÉE - VÉRIFICATION DOUBLON ⭐⭐⭐

exports.ajouterArticle = async (req, res) => {

  try {

    const { utilisateurId, article, quantite = 1 } = req.body;


    if (!article || !article._id) {

      return res.status(400).json({
        success: false,
        message: "Les informations de l'article sont requises"
      });

    }


    let panier = await Panier.findOne({
      utilisateurId,
      statut: "actif"
    });


    if (!panier) {

      panier = new Panier({
        utilisateurId,
        articles: [],
        codePromo: null,
        statut: "actif"
      });

    }


    const articleId = article._id;


    const articleExistant = panier.articles.find(
      item => item.articleId === articleId
    );


    if (articleExistant) {

      return res.status(400).json({

        success: false,

        message: "Cet article est déjà dans votre panier",

        data: articleExistant

      });

    }


    panier.articles.push({

      articleId,

      nom: article.nom,

      prix: article.prix,

      reduction: article.reduction || 0,

      categorie: article.categorie,

      genre: article.genre,

      description: article.description,

      images: article.images || [],

      stock: article.stock || 0,

      couleurs: article.couleurs || [],

      tailles: article.tailles || [],

      vendeurId: article.vendeurId || "",

      vendeurNom: article.vendeurNom || "",

      vendeurTelephone: article.vendeurTelephone || "",

      prixreduit: article.prixreduit || article.prix,

      prixFinal: article.prixFinal || article.prix,

      quantite,

      couleurChoisie: article.couleurChoisie || null,

      tailleChoisie: article.tailleChoisie || null,

      ajouteLe: new Date()

    });


    const panierSauve = await panier.save();


    return res.status(200).json({

      success: true,

      message: "Article ajouté au panier avec succès",

      data: panierSauve

    });


  } catch(error) {


    return res.status(500).json({

      success:false,

      message:"Erreur lors de l'ajout au panier",

      error:error.message

    });


  }

};

exports.mettreAJourQuantite = async (req, res) => {

  try {

    const { utilisateurId, articleId, quantite } = req.body;


    // Vérification articleId
    if (!articleId) {

      return res.status(400).json({
        success: false,
        message: "L'ID de l'article est requis"
      });

    }


    // Vérification quantité
    if (quantite === undefined || quantite === null || quantite <= 0) {

      return res.status(400).json({
        success: false,
        message: "La quantité doit être supérieure à zéro"
      });

    }


    // Recherche du panier actif
    const panier = await Panier.findOne({
      utilisateurId,
      statut: "actif"
    });


    if (!panier) {

      return res.status(404).json({
        success: false,
        message: "Panier non trouvé"
      });

    }


    // Recherche de l'article dans le panier
    const articleIndex = panier.articles.findIndex(
      item => item.articleId.toString() === articleId.toString()
    );


    if (articleIndex === -1) {

      return res.status(404).json({
        success: false,
        message: "Article non trouvé dans le panier"
      });

    }


    // Mise à jour uniquement de la quantité
    panier.articles[articleIndex].quantite = quantite;


    // Sauvegarde
    const panierUpdated = await panier.save();


    return res.status(200).json({

      success: true,

      message: "Quantité mise à jour avec succès",

      data: panierUpdated

    });


  } catch (error) {


    console.error("Erreur mise à jour quantité :", error);


    return res.status(500).json({

      success: false,

      message: "Erreur lors de la mise à jour de la quantité",

      error: error.message

    });


  }

};

// ==================== DELETE ====================
exports.supprimerArticle = (req, res) => {
  const { utilisateurId, articleId } = req.body;

  if (!articleId) {
    return res.status(400).json({
      success: false,
      message: 'L\'ID de l\'article est requis'
    });
  }

  Panier.findOne({ utilisateurId, statut: 'actif' })
    .then(panier => {
      if (!panier) {
        return res.status(404).json({
          success: false,
          message: 'Panier non trouvé pour cet utilisateur'
        });
      }

      const articlesAvant = panier.articles.length;
      panier.articles = panier.articles.filter(
        item => item.articleId !== articleId
      );

      if (panier.articles.length === articlesAvant) {
        return res.status(404).json({
          success: false,
          message: 'Article non trouvé dans le panier'
        });
      }

      return panier.save();
    })
    .then(panierMisAJour => {
      if (!panierMisAJour) return;

      return res.status(200).json({
        success: true,
        message: 'Article supprimé du panier avec succès',
        data: panierMisAJour
      });
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'article',
        error: error.message
      });
    });
};

// ==================== DELETE ALL ====================
exports.viderPanier = (req, res) => {
  const { utilisateurId } = req.body;

  Panier.findOne({ utilisateurId, statut: 'actif' })
    .then(panier => {
      if (!panier) {
        return res.status(404).json({
          success: false,
          message: 'Panier non trouvé pour cet utilisateur'
        });
      }

      panier.articles = [];
      panier.codePromo = null;

      return panier.save();
    })
    .then(panierVide => {
      if (!panierVide) return;

      return res.status(200).json({
        success: true,
        message: 'Panier vidé avec succès',
        data: panierVide
      });
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du vidage du panier',
        error: error.message
      });
    });
};

// ==================== CODE PROMO ====================
exports.appliquerCodePromo = (req, res) => {
  const { utilisateurId, code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Le code promo est requis'
    });
  }

  Panier.findOne({ utilisateurId, statut: 'actif' })
    .then(panier => {
      if (!panier) {
        return res.status(404).json({
          success: false,
          message: 'Panier non trouvé pour cet utilisateur'
        });
      }

      const codesValides = ['PROMO10', 'PROMO20', 'BLACKFRIDAY', 'FREESHIP'];
      if (!codesValides.includes(code.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Code promo invalide'
        });
      }

      panier.codePromo = code.toUpperCase();

      return panier.save();
    })
    .then(panierMisAJour => {
      if (!panierMisAJour) return;

      return res.status(200).json({
        success: true,
        message: 'Code promo appliqué avec succès',
        data: panierMisAJour
      });
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'application du code promo',
        error: error.message
      });
    });
};

exports.supprimerCodePromo = (req, res) => {
  const { utilisateurId } = req.body;

  Panier.findOne({ utilisateurId, statut: 'actif' })
    .then(panier => {
      if (!panier) {
        return res.status(404).json({
          success: false,
          message: 'Panier non trouvé pour cet utilisateur'
        });
      }

      panier.codePromo = null;

      return panier.save();
    })
    .then(panierMisAJour => {
      if (!panierMisAJour) return;

      return res.status(200).json({
        success: true,
        message: 'Code promo supprimé avec succès',
        data: panierMisAJour
      });
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du code promo',
        error: error.message
      });
    });
};

// ==================== COMPTER ====================
exports.compterArticles = (req, res) => {
  const { utilisateurId } = req.params;

  Panier.findOne({ utilisateurId, statut: 'actif' })
    .then(panier => {
      if (!panier) {
        return res.status(200).json({
          success: true,
          message: 'Panier vide',
          data: { totalArticles: 0, nombreProduits: 0 }
        });
      }

      const totalArticles = panier.articles.reduce(
        (total, item) => total + item.quantite,
        0
      );

      return res.status(200).json({
        success: true,
        message: 'Nombre d\'articles récupéré avec succès',
        data: {
          totalArticles: totalArticles,
          nombreProduits: panier.articles.length
        }
      });
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du comptage des articles',
        error: error.message
      });
    });
};

// ==================== ADMIN ====================
exports.supprimerPanier = (req, res) => {
  const { panierId } = req.params;

  Panier.findByIdAndDelete(panierId)
    .then(panierSupprime => {
      if (!panierSupprime) {
        return res.status(404).json({
          success: false,
          message: 'Panier non trouvé'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Panier supprimé avec succès',
        data: panierSupprime
      });
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du panier',
        error: error.message
      });
    });
};

exports.getAllPaniers = (req, res) => {
  const { statut, page = 1, limit = 10 } = req.query;

  const query = {};
  if (statut) query.statut = statut;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  Panier.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .then(paniers => {
      return Panier.countDocuments(query).then(total => {
        return res.status(200).json({
          success: true,
          message: 'Paniers récupérés avec succès',
          data: {
            paniers,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        });
      });
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paniers',
        error: error.message
      });
    });
};

exports.changerStatut = (req, res) => {
  const { panierId } = req.params;
  const { statut } = req.body;

  if (!statut || !['actif', 'abandonne', 'commande'].includes(statut)) {
    return res.status(400).json({
      success: false,
      message: 'Statut invalide. Les statuts valides sont: actif, abandonne, commande'
    });
  }

  Panier.findByIdAndUpdate(
    panierId,
    { statut },
    { new: true, runValidators: true }
  )
    .then(panierMisAJour => {
      if (!panierMisAJour) {
        return res.status(404).json({
          success: false,
          message: 'Panier non trouvé'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Statut du panier mis à jour avec succès',
        data: panierMisAJour
      });
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      });
    });
};