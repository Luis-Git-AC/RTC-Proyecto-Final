import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './styles/variables.css'
import './styles/globals.css'

import Home from './pages/Home/Home'
import Criptos from './pages/Criptos/Criptos'
import Portfolio from './pages/Portfolio/Portfolio'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import AuthGuard from './routes/AuthGuard'
import Foro from './pages/Foro/Foro'
import PostDetalle from './pages/Foro/PostDetalle'
import CrearPost from './pages/Foro/CrearPost'
import EditarPost from './pages/Foro/EditarPost'
import Recursos from './pages/Recursos/Recursos'
import SubirRecurso from './pages/Recursos/SubirRecurso'
import EditarRecurso from './pages/Recursos/EditarRecurso'
import Perfil from './pages/Perfil/Perfil'
import AdminUsers from './pages/Admin/Users'

import RootLayout from './components/Layout/RootLayout'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="criptos" element={<Criptos />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="foro" element={<Foro />} />
          <Route path="foro/:id" element={<PostDetalle />} />
          <Route element={<AuthGuard />}>
            <Route path="foro/nuevo" element={<CrearPost />} />
            <Route path="foro/editar/:id" element={<EditarPost />} />
          </Route>
          <Route path="recursos" element={<Recursos />} />
          <Route element={<AuthGuard />}>
            <Route path="recursos/nuevo" element={<SubirRecurso />} />
            <Route path="recursos/editar/:id" element={<EditarRecurso />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="admin/users" element={<AdminUsers />} />
          </Route>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App