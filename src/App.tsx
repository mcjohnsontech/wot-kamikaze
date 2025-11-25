import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext'; 

// Import your main view components
import SmeDashboard from './views/SmeDashboard';
import RiderPwa from './views/RiderPwa';
import CustomerTracking from './views/CustomerTracking';
import CsatSubmission from './views/CsatSubmission';
import AuthPage from './views/AuthPage'; // NEW IMPORT

const queryClient = new QueryClient();

// --- Protected Route Wrapper ---
// This component checks if the user is authenticated before rendering the children.
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="text-center p-10 text-xl text-blue-600">Loading Application...</div>;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to the login/signup page
    return <Navigate to="/auth" replace />;
  }
  
  // If authenticated, render the protected component
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* Wrap the entire application with the Auth Provider */}
        <Router>
          <Routes>
            {/* 1. Authentication Route (Public) */}
            <Route path="/auth" element={<AuthPage />} />

            {/* 2. Protected SME Dashboard (FR: Only accessible by authenticated user) */}
            <Route 
                path="/sme" 
                element={<ProtectedRoute><SmeDashboard /></ProtectedRoute>} 
            />

            {/* 3. Public Rider PWA (Token-based access, requires no general authentication) */}
            <Route path="/rider/:token" element={<RiderPwa />} />

            {/* 4. Public Customer Tracking PWA (Token-based access, requires no general authentication) */}
            <Route path="/track/:token" element={<CustomerTracking />} />
            
            {/* 5. Public CSAT Submission Route (Token-based submission) */}
            <Route path="/csat/:token" element={<CsatSubmission />} />

            {/* 6. Default/Fallback Route */}
            {/* Redirects to /sme, which will then redirect to /auth if needed */}
            <Route path="/" element={<Navigate to="/sme" replace />} /> 
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;