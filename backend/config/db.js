const mongoose = require('mongoose');

let cached = global.__mongoose
if (!cached) {
  cached = global.__mongoose = { conn: null, promise: null }
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn
  }
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI no está definido')
    cached.promise = mongoose
      .connect(uri)
      .then((mongooseInstance) => {
        console.log(`✅ MongoDB conectado: ${mongooseInstance.connection.host}`)
        console.log(`📊 Base de datos: ${mongooseInstance.connection.name}`)
        return mongooseInstance
      })
      .catch((err) => {
        console.error('❌ Error al conectar a MongoDB:', err?.message || err)
        cached.promise = null
        throw err
      })
  }
  cached.conn = await cached.promise
  return cached.conn
}

module.exports = connectDB;
