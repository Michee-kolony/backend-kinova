const mongoose = require('mongoose');

const administrateurSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  email: {type: String, required: true, unique: true, lowercase: true, trim: true},
  password: { type: String, required: true },
  telephone: { type: String, required: true },
  addresse: { type: String, trim: true },
  role: {type: String, enum: ['admin', 'superadmin'],default: 'admin'},
  date: { type: Date, default: Date.now },
  
  // 🔐 RESET PASSWORD
  resetToken: String,
  resetTokenExpiration: Date
});

module.exports = mongoose.model('Administrateur', administrateurSchema);