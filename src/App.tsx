import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ContratosList from './pages/contratos/ContratosList'
import ContratoNovo from './pages/contratos/ContratoNovo'
import ContratoDetalhe from './pages/contratos/ContratoDetalhe'
import ProcessosList from './pages/processos/ProcessosList'
import ProcessoNovo from './pages/processos/ProcessoNovo'
import ProcessoDetalhe from './pages/processos/ProcessoDetalhe'
import DemandasList from './pages/demandas/DemandasList'
import DemandaNova from './pages/demandas/DemandaNova'
import DemandaDetalhe from './pages/demandas/DemandaDetalhe'
import LgpdPage from './pages/lgpd/LgpdPage'
import EspacoSeguro from './pages/EspacoSeguro'
import EspacoSeguroAdmin from './pages/EspacoSeguroAdmin'
import Usuarios from './pages/Usuarios'

function AppRoutes() {
  const { profile } = useAuth()
  const role = profile?.role

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              {role === 'solicitante' ? <DemandasList /> : <Dashboard />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contratos"
        element={
          <ProtectedRoute roles={['juridico_lider', 'juridico_analista']}>
            <Layout><ContratosList /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contratos/novo"
        element={
          <ProtectedRoute roles={['juridico_lider', 'juridico_analista']}>
            <Layout><ContratoNovo /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contratos/:id"
        element={
          <ProtectedRoute roles={['juridico_lider', 'juridico_analista']}>
            <Layout><ContratoDetalhe /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/processos"
        element={
          <ProtectedRoute roles={['juridico_lider', 'juridico_analista']}>
            <Layout><ProcessosList /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/processos/novo"
        element={
          <ProtectedRoute roles={['juridico_lider', 'juridico_analista']}>
            <Layout><ProcessoNovo /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/processos/:id"
        element={
          <ProtectedRoute roles={['juridico_lider', 'juridico_analista']}>
            <Layout><ProcessoDetalhe /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/demandas"
        element={
          <ProtectedRoute>
            <Layout><DemandasList /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/demandas/nova"
        element={
          <ProtectedRoute>
            <Layout><DemandaNova /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/demandas/:id"
        element={
          <ProtectedRoute>
            <Layout><DemandaDetalhe /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lgpd"
        element={
          <ProtectedRoute roles={['juridico_lider', 'juridico_analista']}>
            <Layout><LgpdPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/espaco-seguro"
        element={
          <ProtectedRoute>
            <Layout><EspacoSeguro /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/espaco-seguro/admin"
        element={
          <ProtectedRoute roles={['juridico_lider', 'juridico_analista']}>
            <Layout><EspacoSeguroAdmin /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute roles={['juridico_lider']}>
            <Layout><Usuarios /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
