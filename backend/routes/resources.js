const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Resource = require('../models/Resource');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { uploadFile, handleMulterError } = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, userId } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const resources = await Resource.find(filter)
      .populate('userId', 'username avatar email')
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments(filter);

    res.status(200).json({
      resources,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener recursos:', error);
    res.status(500).json({ error: 'Error al obtener recursos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('userId', 'username avatar email role');

    if (!resource) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    res.status(200).json({ resource });
  } catch (error) {
    console.error('Error al obtener recurso:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de recurso inválido' });
    }
    
    res.status(500).json({ error: 'Error al obtener recurso' });
  }
});

router.post(
  '/',
  auth,
  uploadFile,
  handleMulterError,
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('El título debe tener entre 5 y 200 caracteres'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
    
    body('type')
      .isIn(['pdf', 'image', 'guide'])
      .withMessage('Tipo inválido. Debe ser: pdf, image o guide'),
    
    body('category')
      .isIn(['análisis-técnico', 'fundamentos', 'trading', 'seguridad', 'defi', 'otro'])
      .withMessage('Categoría inválida')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, type, category } = req.body;

      if (!req.file) {
        return res.status(400).json({ 
          error: 'El archivo es requerido' 
        });
      }

      let resourceType = 'auto';
      if (type === 'pdf') {
        resourceType = 'raw'; 
      } else if (type === 'image') {
        resourceType = 'image';
      } else {
        resourceType = 'auto'; 
      }

      let fileUrl = '';
      try {
        const result = await uploadToCloudinary(
          req.file.buffer,
          'cryptohub/resources',
          resourceType
        );
        fileUrl = result.secure_url;
      } catch (cloudError) {
        console.error('Error al subir archivo a Cloudinary:', cloudError);
        return res.status(500).json({ 
          error: 'Error al subir el archivo' 
        });
      }

      const newResource = new Resource({
        userId: req.userId,
        title,
        description,
        type,
        fileUrl,
        category
      });

      await newResource.save();

      const populatedResource = await Resource.findById(newResource._id)
        .populate('userId', 'username avatar email');

      res.status(201).json({
        message: 'Recurso creado exitosamente',
        resource: populatedResource
      });
    } catch (error) {
      console.error('Error al crear recurso:', error);
      res.status(500).json({ error: 'Error al crear recurso' });
    }
  }
);

router.put(
  '/:id',
  auth,
  uploadFile,
  handleMulterError,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('El título debe tener entre 5 y 200 caracteres'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
    
    body('type')
      .optional()
      .isIn(['pdf', 'image', 'guide'])
      .withMessage('Tipo inválido'),
    
    body('category')
      .optional()
      .isIn(['análisis-técnico', 'fundamentos', 'trading', 'seguridad', 'defi', 'otro'])
      .withMessage('Categoría inválida')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const resource = await Resource.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }

      if (resource.userId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'No tienes permisos para editar este recurso' 
        });
      }

      const { title, description, type, category } = req.body;
      if (title) resource.title = title;
      if (description) resource.description = description;
      if (type) resource.type = type;
      if (category) resource.category = category;

      if (req.file) {
        if (resource.fileUrl) {
          try {
            const urlParts = resource.fileUrl.split('/');
            const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
            
            const oldResourceType = resource.type === 'pdf' ? 'raw' : 'image';
            
            console.log('🗑️ Eliminando archivo anterior de Cloudinary:', folderAndFile);
            await deleteFromCloudinary(folderAndFile, oldResourceType);
          } catch (delError) {
            console.error('❌ Error al eliminar archivo anterior:', delError);
          }
        }

        try {
          const newType = req.body.type || resource.type;
          const resourceType = newType === 'pdf' ? 'raw' : (newType === 'image' ? 'image' : 'auto');
          
          const result = await uploadToCloudinary(
            req.file.buffer,
            'cryptohub/resources',
            resourceType
          );
          resource.fileUrl = result.secure_url;
        } catch (cloudError) {
          console.error('Error al subir nuevo archivo:', cloudError);
          return res.status(500).json({ 
            error: 'Error al subir el nuevo archivo' 
          });
        }
      }

      await resource.save();

      const updatedResource = await Resource.findById(resource._id)
        .populate('userId', 'username avatar email');

      res.status(200).json({
        message: 'Recurso actualizado exitosamente',
        resource: updatedResource
      });
    } catch (error) {
      console.error('Error al actualizar recurso:', error);
      
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: 'ID de recurso inválido' });
      }
      
      res.status(500).json({ error: 'Error al actualizar recurso' });
    }
  }
);

router.delete('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    if (resource.userId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'No tienes permisos para eliminar este recurso' 
      });
    }

    if (resource.fileUrl) {
      try {
        const urlParts = resource.fileUrl.split('/');
        const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
        
        const resourceType = resource.type === 'pdf' ? 'raw' : 'image';
        
        console.log('🗑️ Eliminando de Cloudinary:', folderAndFile, `(${resourceType})`);
        await deleteFromCloudinary(folderAndFile, resourceType);
      } catch (delError) {
        console.error('❌ Error al eliminar archivo de Cloudinary:', delError);
      }
    }

    await Resource.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: 'Recurso eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar recurso:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de recurso inválido' });
    }
    
    res.status(500).json({ error: 'Error al eliminar recurso' });
  }
});

module.exports = router;
