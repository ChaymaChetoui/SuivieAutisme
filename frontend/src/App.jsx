// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChildrenList from './pages/ChildrenList';
import ChildForm from './pages/ChildForm';
import EmotionsPage from './pages/EmotionsPage';

// Components
import Loading from './components/common/loading';

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Chargement..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ============================================
// PUBLIC ROUTE COMPONENT
// Redirige vers dashboard si déjà connecté
// ============================================
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Chargement..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ============================================
// APP ROUTES
// ============================================
function AppRoutes() {
  return (
    <Routes>
      {/* ==================== */}
      {/* PUBLIC ROUTES */}
      {/* ==================== */}
      
      {/* Login */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Register */}
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* ==================== */}
      {/* PROTECTED ROUTES */}
      {/* ==================== */}

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Children List */}
      <Route
        path="/children"
        element={
          <ProtectedRoute>
            <ChildrenList />
          </ProtectedRoute>
        }
      />

      {/* Add Child */}
      <Route
        path="/children/new"
        element={
          <ProtectedRoute>
            <ChildForm />
          </ProtectedRoute>
        }
      />

      {/* Edit Child */}
      <Route
        path="/children/:id/edit"
        element={
          <ProtectedRoute>
            <ChildForm />
          </ProtectedRoute>
        }
      />

      {/* Child Profile (à implémenter) */}
      <Route
        path="/children/:id"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Emotions Page */}
      <Route
        path="/emotions"
        element={
          <ProtectedRoute>
            <EmotionsPage />
          </ProtectedRoute>
        }
      />

      {/* Statistics (utilise EmotionsPage pour l'instant) */}
      <Route
        path="/statistics"
        element={
          <ProtectedRoute>
            <EmotionsPage />
          </ProtectedRoute>
        }
      />

      {/* AI Insights (à implémenter) */}
      <Route
        path="/ai-insights"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Settings (à implémenter) */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* ==================== */}
      {/* REDIRECTS */}
      {/* ==================== */}

      {/* Root redirect to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            // Default options
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            
            // Success
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #10b981',
              },
            },
            
            // Error
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #ef4444',
              },
            },
            
            // Loading
            loading: {
              iconTheme: {
                primary: '#0ea5e9',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;