const { S3Client } = require("@aws-sdk/client-s3");

const r2 = new S3Client({
    region: "auto",
    endpoint: 'https://ab441d8b9d82770b6245f4ab99a9e1e2.r2.cloudflarestorage.com',
    credentials: {
        accessKeyId: 'd75444cfcfc5342084c5d49ef21dcffd',
        secretAccessKey: 'da394ec2f4d40437e46e81e71da9fd0f82d1fe2b6fe0d0848349c9dba26cc4ba'
    }
});

module.exports = r2;