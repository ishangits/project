import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';



const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { admin, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

//   if (!initialized || loading) {
//   return <LoadingSpinner />;
// }
  // Redirect only if no token/admin
  if (!admin || !token) return <Navigate to="/login" replace />;

  return <>{children}</>;
};


export default ProtectedRoute;