const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Resource = require('../models/Resource');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { uploadSingle, handleMulterError } = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

router.get('/me/portfolio', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('portfolio');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const items = Array.isArray(user.portfolio) ? user.portfolio : [];
    res.status(200).json({ items });
  } catch (error) {
    console.error('Error al obtener portfolio:', error);
    res.status(500).json({ error: 'Error al obtener portfolio' });
  }
});

router.put(
  '/me/portfolio',
  auth,
  [
    body('items')
      .isArray({ min: 0 })
      .withMessage('El campo items debe ser un arreglo'),
    body('items.*.coinId')
      .isString()
      .withMessage('coinId debe ser string')
      .bail()
      .notEmpty()
      .withMessage('coinId es obligatorio'),
    body('items.*.amount')
      .isFloat({ min: 0 })
      .withMessage('amount debe ser un número mayor o igual a 0')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { items } = req.body;

      const normalized = (items || []).map(({ coinId, amount }) => ({
        coinId: String(coinId).trim(),
        amount: Number(amount),
        addedAt: new Date()
      }));

      user.portfolio = normalized;
      await user.save();

      res.status(200).json({
        message: 'Portfolio actualizado',
        items: user.portfolio
      });
    } catch (error) {
      console.error('Error al actualizar portfolio:', error);
      res.status(500).json({ error: 'Error al actualizar portfolio' });
    }
  }
);

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

router.put(
  '/profile',
  auth,
  uploadSingle,
  handleMulterError,
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('El username debe tener entre 3 y 30 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('El username solo puede contener letras, números y guiones bajos'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail({
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        gmail_convert_googlemaildotcom: false
      }),
    
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    
    body('wallet_address')
      .optional()
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Dirección de wallet inválida')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { username, email, password, wallet_address } = req.body;

      if (username || email) {
        const existingUser = await User.findOne({
          $or: [
            username ? { username } : null,
            email ? { email } : null
          ].filter(Boolean),
          _id: { $ne: req.userId }
        });

        if (existingUser) {
          return res.status(400).json({ 
            error: 'El username o email ya está en uso' 
          });
        }
      }

      if (username) user.username = username;
      if (email) user.email = email;
      if (wallet_address !== undefined) user.wallet_address = wallet_address;

      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }

      if (req.file) {
        if (user.avatar && user.avatar.includes('cloudinary.com')) {
          try {
            const urlParts = user.avatar.split('/');
            const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
            console.log('🗑️ Eliminando avatar anterior:', folderAndFile);
            await deleteFromCloudinary(folderAndFile, 'image');
          } catch (delError) {
            console.error('❌ Error al eliminar avatar anterior:', delError);
          }
        }

        try {
          const result = await uploadToCloudinary(
            req.file.buffer,
            'cryptohub/avatars',
            'image'
          );
          user.avatar = result.secure_url;
        } catch (cloudError) {
          console.error('Error al subir avatar:', cloudError);
          return res.status(500).json({ 
            error: 'Error al subir el avatar' 
          });
        }
      }

      await user.save();

      const updatedUser = await User.findById(user._id).select('-password');

      res.status(200).json({
        message: 'Perfil actualizado exitosamente',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }
);

router.get('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    
    const filter = {};
    if (role) filter.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({ 
        error: 'No puedes eliminar tu propio usuario' 
      });
    }

    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      try {
        const urlParts = user.avatar.split('/');
        const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
        console.log('🗑️ Eliminando avatar del usuario:', folderAndFile);
        await deleteFromCloudinary(folderAndFile, 'image');
      } catch (delError) {
        console.error('❌ Error al eliminar avatar:', delError);
      }
    }

    const userPosts = await Post.find({ userId: req.params.id });
    for (const post of userPosts) {
      if (post.image && post.image.includes('cloudinary.com')) {
        try {
          const urlParts = post.image.split('/');
          const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
          console.log('🗑️ Eliminando imagen de post:', folderAndFile);
          await deleteFromCloudinary(folderAndFile, 'image');
        } catch (delError) {
          console.error('❌ Error al eliminar imagen de post:', delError);
        }
      }
    }
    await Post.deleteMany({ userId: req.params.id });

    await Comment.deleteMany({ userId: req.params.id });

    const userResources = await Resource.find({ userId: req.params.id });
    for (const resource of userResources) {
      if (resource.fileUrl && resource.fileUrl.includes('cloudinary.com')) {
        try {
          const urlParts = resource.fileUrl.split('/');
          const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
          const resourceType = resource.type === 'pdf' ? 'raw' : 'image';
          console.log('🗑️ Eliminando recurso:', folderAndFile, `(${resourceType})`);
          await deleteFromCloudinary(folderAndFile, resourceType);
        } catch (delError) {
          console.error('❌ Error al eliminar recurso:', delError);
        }
      }
    }
    await Resource.deleteMany({ userId: req.params.id });

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: 'Usuario y todo su contenido eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
