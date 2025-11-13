// Arranca la app en un puerto efímero y comprueba /api/health
const http = require('http')
const app = require('../app')

const server = http.createServer(app)

server.listen(0, () => {
  const { port } = server.address()
  const options = {
    hostname: '127.0.0.1',
    port,
    path: '/api/health',
    method: 'GET',
  }

  const req = http.request(options, (res) => {
    let data = ''
    res.on('data', (chunk) => (data += chunk))
    res.on('end', () => {
      console.log('STATUS', res.statusCode)
      console.log('BODY', data)
      server.close(() => process.exit(res.statusCode === 200 ? 0 : 1))
    })
  })

  req.on('error', (err) => {
    console.error('REQUEST_ERROR', err.message)
    server.close(() => process.exit(1))
  })

  req.end()
})
