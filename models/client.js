const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  telephone: { type: String, required: true },
  adresse: { type: String, trim: true },
  genre: {
  type: String,
  enum: ['Homme', 'Femme'],
  set: (value) => {
    if (!value) return value;
    const v = value.toLowerCase();
    if (v === 'homme' || v === 'h') return 'Homme';
    if (v === 'femme' || v === 'f') return 'Femme';
    return value;
  }
},
  date: { type: Date, default: Date.now },

  // 🔐 RESET PASSWORD
  resetToken: String,
  resetTokenExpiration: Date,
  resetCode: {
    type: String
},

resetCodeExpiration: {
    type: Date
},
});

module.exports = mongoose.model('Client', clientSchema);