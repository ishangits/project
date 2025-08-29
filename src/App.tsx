import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import TokenUsage from './pages/TokenUsage';
import Reports from './pages/Reports';
import Domains from './pages/Domains';
import ChangePassword from './pages/ChangePassword';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
  path="/change-password"
  element={
    <ProtectedRoute>
      <Layout>
        <ChangePassword />
      </Layout>
    </ProtectedRoute>
  }
/>

          <Route
            path="/domains"
            element={
              <ProtectedRoute>
                <Layout>
                  <Domains />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-base"
            element={
              <ProtectedRoute>
                <Layout>
                  <KnowledgeBase />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/token-usage"
            element={
              <ProtectedRoute>
                <Layout>
                  <TokenUsage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
            <ToastContainer position="top-right" autoClose={3000} />

    </AuthProvider>
  );
}

export default App;