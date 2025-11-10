import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './styles/variables.css'
import './styles/globals.css'

import Home from './pages/Home/Home'
import Criptos from './pages/Criptos/Criptos'
import Portfolio from './pages/Portfolio/Portfolio'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import AuthGuard from './routes/AuthGuard'

import RootLayout from './components/Layout/RootLayout'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="criptos" element={<Criptos />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route element={<AuthGuard />}>
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App