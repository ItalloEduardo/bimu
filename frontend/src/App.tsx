import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Home from './pages/Home'
import Usuarios from './pages/Usuarios'
import Livros from './pages/Livros'
import Exemplares from './pages/Exemplares'
import Emprestimos from './pages/Emprestimos'
import Multas from './pages/Multas'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="livros" element={<Livros />} />
          <Route path="exemplares" element={<Exemplares />} />
          <Route path="emprestimos" element={<Emprestimos />} />
          <Route path="multas" element={<Multas />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
