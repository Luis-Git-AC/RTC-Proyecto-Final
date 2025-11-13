const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/User')

const router = express.Router()


router.post('/admin', async (req, res) => {
  try {
    if (process.env.ALLOW_BOOTSTRAP !== 'true') {
      return res.status(404).json({ error: 'Not found' })
    }

    const token = req.header('x-setup-token')
    if (!token || token !== process.env.SETUP_TOKEN) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { email, username, password, resetPassword } = req.body || {}
    if (!email || !username) {
      return res.status(400).json({ error: 'email y username son requeridos' })
    }

    let user = await User.findOne({ email })
    if (!user) {
      if (!password) {
        return res.status(400).json({ error: 'password requerido para crear usuario' })
      }
      const hashed = await bcrypt.hash(password, 10)
      user = new User({
        email,
        username,
        password: hashed,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=dc2626`,
        wallet_address: '',
        role: 'admin',
      })
      await user.save()
    } else {
      user.role = 'admin'
      if (resetPassword && password) {
        const hashed = await bcrypt.hash(password, 10)
        user.password = hashed
      }
      await user.save()
    }

    return res.status(200).json({
      message: 'Usuario admin disponible',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        wallet_address: user.wallet_address,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('Error en /api/bootstrap/admin:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
