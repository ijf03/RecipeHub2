const mongoose = require('mongoose');

const USER_ROLES = ['admin', 'chef', 'manager'];

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    match: /^U-\d{5}$/, // U-00001
  },
  fullName: {
    type: String,
    required: true,
    minlength: 3,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // email format
    unique: true
  },
  password: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: USER_ROLES,
    default: 'manager'
  },
  phone: {
    type: String,
    trim: true,
    match: /^(\+?\d[\d\s-]{6,})?$/
  },
  createdDate: {
    type: String, //YYYY-MM-DD
    default: () => new Date().toISOString().slice(0, 10)
  }
}, { versionKey: false });

module.exports = mongoose.model('User', userSchema);
