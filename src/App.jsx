
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ActivitiesPage from '@/pages/ActivitiesPage';
import LibraryPage from '@/pages/LibraryPage';
import AssistantPage from '@/pages/AssistantPage';
import ReportsPage from '@/pages/ReportsPage';
import ProfilePage from '@/pages/ProfilePage';
import PlanningPage from '@/pages/PlanningPage';
// AdminUsersPage ya no se usa directamente, se accede a través de GlobalSettingsPage
// import AdminUsersPage from '@/pages/AdminUsersPage'; 
import GlobalSettingsPage from '@/pages/GlobalSettingsPage';
import { UserProvider, useUser, ROLES } from '@/contexts/UserContext';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useUser(); 


  if (!user) {
    console.warn("ProtectedRoute (Simulado): No hay usuario simulado. Esto no debería pasar con el UserContext simulado.");
    // En un entorno real, redirigiría a la página de login.
    // Para la simulación, permitimos el acceso o redirigimos a dashboard si el rol no coincide.
    return <Navigate to="/dashboard" replace />; 
  }
  
  // Si allowedRoles está definido y el rol del usuario no está en la lista o no tiene rol.
  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
    console.warn(`ProtectedRoute (Simulado): Rol de usuario simulado (${user.role}) no permitido para esta ruta, redirigiendo a dashboard.`);
    return <Navigate to="/dashboard" replace />; // O a una página de "Acceso Denegado"
  }

  return children;
};

const AppContent = () => {
  const { user, loadingAuth } = useUser(); // Usar loadingAuth del contexto
  
  const allAuthenticatedRoles = [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR, ROLES.WORKER, ROLES.DEVELOPER];
  const adminRolesForRoutes = [ROLES.ADMIN, ROLES.CEO, ROLES.DEVELOPER]; 
  const workerSupervisorAdminCeoRoles = [ROLES.WORKER, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.CEO, ROLES.DEVELOPER];

  if (loadingAuth || !user) { // Mostrar carga si loadingAuth es true o si el usuario aún no está definido
     return (
      <div className="flex flex-col items-center justify-center h-screen text-primary text-xl font-semibold bg-background p-4">
        Cargando configuración inicial...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute allowedRoles={allAuthenticatedRoles}><Layout><DashboardPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/planning" 
        element={<ProtectedRoute allowedRoles={allAuthenticatedRoles}><Layout><PlanningPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/projects" 
        element={<ProtectedRoute allowedRoles={allAuthenticatedRoles}><Layout><ProjectsPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/activities" 
        element={<ProtectedRoute allowedRoles={allAuthenticatedRoles}><Layout><ActivitiesPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/library" 
        element={<ProtectedRoute allowedRoles={workerSupervisorAdminCeoRoles}><Layout><LibraryPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/assistant" 
        element={<ProtectedRoute allowedRoles={allAuthenticatedRoles}><Layout><AssistantPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/reports" 
        element={<ProtectedRoute allowedRoles={adminRolesForRoutes}><Layout><ReportsPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/profile" 
        element={<ProtectedRoute allowedRoles={allAuthenticatedRoles}><Layout><ProfilePage /></Layout></ProtectedRoute>} 
      />
      {/* La ruta /admin/users se elimina o se redirige si es necesario, ya que ahora está dentro de /admin/settings */}
      {/* <Route 
        path="/admin/users" 
        element={<ProtectedRoute allowedRoles={adminRolesForRoutes}><Layout><AdminUsersPage /></Layout></ProtectedRoute>} 
      /> */}
      <Route 
        path="/admin/settings" 
        element={<ProtectedRoute allowedRoles={adminRolesForRoutes}><Layout><GlobalSettingsPage /></Layout></ProtectedRoute>} 
      />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;