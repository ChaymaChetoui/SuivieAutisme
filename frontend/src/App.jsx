// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import TherapistPatients from './pages/TherapistPatients';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import ChildrenList from './pages/ChildrenList';
import ChildForm from './pages/ChildForm';
import ChildProfile from './pages/ChildProfile';
import EmotionsPage from './pages/EmotionsPage';
import AdvancedStatistics from './pages/AdvancedStatics';
import AddEmotion from './pages/AddEmotion';

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
// ROLE-BASED REDIRECT
// ============================================
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'therapist') {
    return <Navigate to="/therapist/dashboard" replace />;
  }
  
  return <Dashboard />;
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
      
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* ==================== */}
      {/* PROTECTED ROUTES - COMMON */}
      {/* ==================== */}

      {/* Dashboard (redirection selon rôle) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapist/patients"
        element={
          <ProtectedRoute>
            <TherapistPatients />
          </ProtectedRoute>
        }
      />

      {/* Children Routes */}
      <Route
        path="/children"
        element={
          <ProtectedRoute>
            <ChildrenList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/children/new"
        element={
          <ProtectedRoute>
            <ChildForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/children/:id"
        element={
          <ProtectedRoute>
            <ChildProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/children/:id/edit"
        element={
          <ProtectedRoute>
            <ChildForm />
          </ProtectedRoute>
        }
      />

      {/* Emotions */}
      <Route
        path="/emotions"
        element={
          <ProtectedRoute>
            <EmotionsPage />
          </ProtectedRoute>
        }
      />

      {/* Add Emotion */}
      <Route
        path="/emotions/new"
        element={
          <ProtectedRoute>
            <AddEmotion />
          </ProtectedRoute>
        }
      />

      {/* Statistics */}
      <Route
        path="/statistics"
        element={
          <ProtectedRoute>
            <AdvancedStatistics />
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
      {/* THERAPIST ROUTES */}
      {/* ==================== */}

      <Route
        path="/therapist/dashboard"
        element={
          <ProtectedRoute>
            <TherapistDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/therapist/patients"
        element={
          <ProtectedRoute>
            <TherapistDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/therapist/patients/:id"
        element={
          <ProtectedRoute>
            <ChildProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/therapist/sessions"
        element={
          <ProtectedRoute>
            <TherapistDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/therapist/reports"
        element={
          <ProtectedRoute>
            <TherapistDashboard />
          </ProtectedRoute>
        }
      />

      {/* ==================== */}
      {/* REDIRECTS */}
      {/* ==================== */}

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
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