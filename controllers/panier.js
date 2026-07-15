const Panier = require('../models/panier');


exports.creerPanier = (req, res) => {
  const { utilisateurId } = req.body;

  // Vérifier si l'utilisateur a déjà un panier actif
  Panier.findOne({ utilisateurId, statut: 'actif' })
    .then(panierExistant => {
      if (panierExistant) {
        return res.status(400).json({
          success: false,
          message: 'Un panier actif existe déjà pour cet utilisateur',
          data: panierExistant
        });
      }

      // Créer un nouveau panier
      const nouveauPanier = new Panier({
        utilisateurId,
        articles: [],
        codePromo: null,
        statut: 'actif'
      });

      return nouveauPanier.save();
    })
    .then(panierCree => {
      res.status(201).json({
        success: true,
        message: 'Panier créé avec succès',
        data: panierCree
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du panier',
        error: error.message
      });
    });
};

//Récupérer le panier d'un utilisateur
exports.getPanier = (req, res) => {
  const { utilisateurId } = req.params;

  Panier.findOne({ utilisateurId, statut: 'actif' })
    .then(panier => {
      if (!panier) {
        // Si le panier n'existe pas, en créer un nouveau
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
      res.status(200).json({
        success: true,
        message: 'Panier récupéré avec succès',
        data: panier
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du panier',
        error: error.message
      });
    });
};

//Ajouter un article au panier
exports.ajouterArticle = (req, res) => {
  const { utilisateurId, article, quantite = 1 } = req.body;

  // Validation de base
  if (!article || !article._id) {
    return res.status(400).json({
      success: false,
      message: 'Les informations de l\'article sont requises'
    });
  }

  Panier.findOne({ utilisateurId, statut: 'actif' })
    .then(panier => {
      if (!panier) {
        // Créer un nouveau panier si inexistant
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
      // Vérifier si l'article existe déjà dans le panier
      const indexExistant = panier.articles.findIndex(
        item => item.articleId === (article._id || article.id)
      );

      if (indexExistant !== -1) {
        // Mettre à jour la quantité si l'article existe déjà
        panier.articles[indexExistant].quantite += quantite;
      } else {
        // Ajouter le nouvel article
        panier.articles.push({
          articleId: article._id || article.id,
          nom: article.nom,
          prix: article.prix,
          reduction: article.reduction || 0,
          categorie: article.categorie,
          genre: article.genre,
          description: article.description,
          images: article.images,
          stock: article.stock,
          couleurs: article.couleurs || [],
          tailles: article.tailles || [],
          vendeurId: article.vendeurId,
          vendeurNom: article.vendeurNom,
          vendeurTelephone: article.vendeurTelephone,
          createdAt: article.createdAt,
          prixreduit: article.prixreduit || article.prix,
          prixFinal: article.prixFinal || article.prix,
          quantite: quantite,
          couleurChoisie: article.couleurChoisie || null,
          tailleChoisie: article.tailleChoisie || null,
          ajouteLe: new Date()
        });
      }

      return panier.save();
    })
    .then(panierMisAJour => {
      res.status(200).json({
        success: true,
        message: 'Article ajouté au panier avec succès',
        data: panierMisAJour
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout de l\'article au panier',
        error: error.message
      });
    });
};

//Mettre à jour la quantité d'un article dans le panier
exports.mettreAJourQuantite = (req, res) => {
  const { utilisateurId, articleId, quantite } = req.body;

  // Validation
  if (!articleId) {
    return res.status(400).json({
      success: false,
      message: 'L\'ID de l\'article est requis'
    });
  }

  if (quantite === undefined || quantite < 0) {
    return res.status(400).json({
      success: false,
      message: 'La quantité doit être un nombre positif'
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

      // Trouver l'article dans le panier
      const articleIndex = panier.articles.findIndex(
        item => item.articleId === articleId
      );

      if (articleIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Article non trouvé dans le panier'
        });
      }

      // Si quantité = 0, supprimer l'article
      if (quantite === 0) {
        panier.articles.splice(articleIndex, 1);
      } else {
        panier.articles[articleIndex].quantite = quantite;
      }

      return panier.save();
    })
    .then(panierMisAJour => {
      if (!panierMisAJour) return; // Déjà géré plus haut

      res.status(200).json({
        success: true,
        message: 'Quantité mise à jour avec succès',
        data: panierMisAJour
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la quantité',
        error: error.message
      });
    });
};

//Supprimer un article du panier
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

      // Filtrer pour supprimer l'article
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
      if (!panierMisAJour) return; // Déjà géré plus haut

      res.status(200).json({
        success: true,
        message: 'Article supprimé du panier avec succès',
        data: panierMisAJour
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'article',
        error: error.message
      });
    });
};

//Vider le panier
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

      // Vider le panier
      panier.articles = [];
      panier.codePromo = null;

      return panier.save();
    })
    .then(panierVide => {
      if (!panierVide) return; // Déjà géré plus haut

      res.status(200).json({
        success: true,
        message: 'Panier vidé avec succès',
        data: panierVide
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du vidage du panier',
        error: error.message
      });
    });
};

// 🏷️ Appliquer un code promo
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

      // Vérifier si le code promo est valide (exemple)
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
      if (!panierMisAJour) return; // Déjà géré plus haut

      res.status(200).json({
        success: true,
        message: 'Code promo appliqué avec succès',
        data: panierMisAJour
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'application du code promo',
        error: error.message
      });
    });
};

//Supprimer le code promo
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
      if (!panierMisAJour) return; // Déjà géré plus haut

      res.status(200).json({
        success: true,
        message: 'Code promo supprimé avec succès',
        data: panierMisAJour
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du code promo',
        error: error.message
      });
    });
};

//Compter le nombre d'articles dans le panier
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

      res.status(200).json({
        success: true,
        message: 'Nombre d\'articles récupéré avec succès',
        data: {
          totalArticles: totalArticles,
          nombreProduits: panier.articles.length
        }
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du comptage des articles',
        error: error.message
      });
    });
};

//Supprimer complètement un panier (admin)
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

      res.status(200).json({
        success: true,
        message: 'Panier supprimé avec succès',
        data: panierSupprime
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du panier',
        error: error.message
      });
    });
};

//Récupérer tous les paniers (admin)
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
        res.status(200).json({
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
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paniers',
        error: error.message
      });
    });
};

//Changer le statut d'un panier
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

      res.status(200).json({
        success: true,
        message: 'Statut du panier mis à jour avec succès',
        data: panierMisAJour
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      });
    });
};