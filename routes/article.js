const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");

const articleController = require("../controllers/article");

router.post("/", upload.array("images",3), articleController.createArticle);
router.get('/', articleController.getArticle);
router.delete('/:id', articleController.deleteArticle);

module.exports = router;