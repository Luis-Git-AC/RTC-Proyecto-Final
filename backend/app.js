require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()

console.log('🔧 Iniciando CryptoHub API')
console.log('NODE_ENV:', process.env.NODE_ENV || 'development')
console.log('MONGODB_URI set?:', Boolean(process.env.MONGODB_URI))

connectDB().catch((err) => {
  console.error('❌ Error al conectar a MongoDB en boot:', err?.message || err)
})

const parseOrigins = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const devFallbackOrigins = ['http://localhost:5173', 'http://localhost:5174']
const envOrigins = process.env.FRONTEND_URLS
  ? parseOrigins(process.env.FRONTEND_URLS)
  : (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : devFallbackOrigins)
const allowedOrigins = new Set(envOrigins)

const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin')
  if (!origin) return callback(null, { origin: true, credentials: true })
  if (allowedOrigins.has(origin)) return callback(null, { origin: true, credentials: true })
  try {
    const originHost = new URL(origin).host
    if (originHost === req.headers.host) {
      return callback(null, { origin: true, credentials: true })
    }
  } catch {}
  return callback(null, { origin: false })
}

app.use(cors(corsOptionsDelegate))
app.options('*', cors(corsOptionsDelegate))
app.use(express.json({ limit: '4mb' }))
app.use(express.urlencoded({ extended: true }))

const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/posts')
const commentRoutes = require('./routes/comments')
const resourceRoutes = require('./routes/resources')
const userRoutes = require('./routes/users')
let bootstrapRoutes = null
try {
  bootstrapRoutes = require('./routes/bootstrap')
} catch {}

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/users', userRoutes)
if (process.env.ALLOW_BOOTSTRAP === 'true') {
  app.use('/api/bootstrap', bootstrapRoutes)
}

app.get('/', (req, res) => {
  res.json({
    message: 'CryptoHub API - Backend funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      comments: '/api/comments',
      resources: '/api/resources',
    },
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
  })
})

app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
  })
})

module.exports = app
