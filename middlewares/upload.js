const multer = require("multer");
const multerS3 = require("multer-s3");
const r2 = require("../config/r2");

const storage = multerS3({

    s3: r2,

    bucket: 'kinova',

    contentType: multerS3.AUTO_CONTENT_TYPE,

    acl: undefined,

    key: function(req, file, cb){

        const filename =
            Date.now() +
            "-" +
            Math.round(Math.random()*1000000) +
            "-" +
            file.originalname;

        cb(null, filename);

    }

});

module.exports = multer({

    storage,

    limits:{
        fileSize:10*1024*1024
    }

});