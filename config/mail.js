const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

    host: "mail.ayemtech.com",
    port: 465,
    secure: true,

    auth: {
        user: "kinova@ayemtech.com",
        pass: "Kinova@17"
    }

});

module.exports = transporter;