
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
import RoleSelectionPage from '@/pages/RoleSelectionPage';
import ProjectTrackingPage from '@/pages/ProjectTrackingPage';
import ProjectSelectionForTrackingPage from '@/pages/ProjectSelectionForTrackingPage';
import ResourcesManagementPage from '@/pages/hr/ResourcesManagementPage';
import TimeTrackingPage from '@/pages/hr/TimeTrackingPage';
import AbsenceManagementPage from '@/pages/hr/AbsenceManagementPage';
import { UserProvider, useUser, ROLES } from '@/contexts/UserContext';
import PlanningPage from '@/pages/PlanningPage';



const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useUser();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppContent = () => {
  const { user } = useUser();

  return (
    <Routes>
      <Route path="/" element={!user ? <RoleSelectionPage /> : <Navigate to="/dashboard" replace />} />
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/projects" 
        element={<ProtectedRoute><Layout><ProjectsPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/planning" 
        element={<ProtectedRoute><Layout><PlanningPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/activities" 
        element={<ProtectedRoute><Layout><ActivitiesPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/tracking" 
        element={<ProtectedRoute><Layout><ProjectSelectionForTrackingPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/tracking/:projectId" 
        element={<ProtectedRoute><Layout><ProjectTrackingPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/library" 
        element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CEO]}><Layout><LibraryPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/assistant" 
        element={<ProtectedRoute><Layout><AssistantPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/reports" 
        element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CEO]}><Layout><ReportsPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/profile" 
        element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} 
      />
      {/* HR Routes */}
      <Route 
        path="/hr/resources" 
        element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CEO]}><Layout><ResourcesManagementPage /></Layout></ProtectedRoute>} 
      />
      <Route 
        path="/hr/time-tracking" 
        element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CEO, ROLES.WORKER]}><Layout><TimeTrackingPage /></Layout></ProtectedRoute>} 
      />
       <Route 
        path="/hr/absences" 
        element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CEO, ROLES.WORKER]}><Layout><AbsenceManagementPage /></Layout></ProtectedRoute>} 
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
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
