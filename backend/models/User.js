const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El username es obligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'El username debe tener al menos 3 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email no válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria']
  },
  avatar: {
    type: String,
    default: null
  },
  wallet_address: {
    type: String,
    default: null,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  portfolio: [
    {
      coinId: {
        type: String,
        required: true,
        trim: true
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'La cantidad no puede ser negativa']
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
