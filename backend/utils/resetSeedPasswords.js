require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const User = require('../models/User')

const OLD_HASH = '$2b$10$K7L/8Y3rt38OAK2M8Ko.deRw4wBAdbEi8Jmk2KdT5RZoqPzFy2QLS'
const NEW_HASH = '$2b$10$3HiTzrnucJ3JXHPlfOTOduunyofNZ2eDJEkrjf.tf3JHw6iaKKVYS'

async function main() {
  const apply = process.argv.includes('--apply')
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Conectado a MongoDB')

    const count = await User.countDocuments({ password: OLD_HASH })
    console.log(`Usuarios con hash antiguo: ${count}`)

    if (!apply) {
      const sample = await User.find({ password: OLD_HASH }).select('email username').limit(10)
      console.log('Muestra (máx 10):', sample.map(u => `${u.username} <${u.email}>`).join(', '))
      console.log('\nEjecuta con --apply para actualizar a la nueva contraseña (AdminSeguro!2025).')
      return
    }

    if (count === 0) {
      console.log('No hay usuarios que actualizar. Nada que hacer.')
      return
    }

    const res = await User.updateMany(
      { password: OLD_HASH },
      { $set: { password: NEW_HASH } }
    )
    console.log(`✅ Actualizados: ${res.modifiedCount} de ${count}`)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect().catch(() => {})
  }
}

main()
