import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ActivitiesPage from "@/pages/ActivitiesPage";
import LibraryPage from "@/pages/LibraryPage";
import RegisterPage from "./pages/RegisterPage";
import AssistantPage from "@/pages/AssistantPage";
import ReportsPage from "@/pages/ReportsPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import ProjectTrackingPage from "@/pages/ProjectTrackingPage";
import ResourcesManagementPage from "@/pages/hr/ResourcesManagementPage";
import TimeTrackingPage from "@/pages/hr/TimeTrackingPage";
import AbsenceManagementPage from "@/pages/hr/AbsenceManagementPage";
import { UserProvider, useUser, ROLES } from "@/contexts/UserContext";
import PlanningPage from "@/pages/PlanningPage";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loadingAuth } = useUser();
  const location = useLocation();

  if (loadingAuth && !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const AppContent = () => {
  const { user } = useUser();

  return (
    <>
      <Routes>
        {/* --- Rutas Públicas --- */}
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/register"
          element={
            !user ? <RegisterPage /> : <Navigate to="/dashboard" replace />
          }
        />

        {/* --- Ruta Raíz: Redirige si ya está logueado --- */}
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />

        {/* --- RUTAS PROTEGIDAS AGRUPADAS --- */}
        {/* Todas las rutas dentro de este bloque estarán protegidas por ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/assistant" element={<AssistantPage />} />
        </Route>

        {/* --- Rutas Protegidas con ROLES específicos --- */}
        <Route
          element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CEO]} />}
        >
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.CEO, ROLES.DEVELOPER]}
            />
          }
        >
          <Route path="/hr/resources" element={<ResourcesManagementPage />} />
        </Route>
        <Route
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.CEO, ROLES.DEVELOPER]}
            />
          }
        >
          <Route
            path="/tracking/:projectId"
            element={<ProjectTrackingPage />}
          />
        </Route>
        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CEO,
                ROLES.DEVELOPER,
                ROLES.WORKER,
              ]}
            />
          }
        >
          <Route path="/hr/time-tracking" element={<TimeTrackingPage />} />
          <Route path="/hr/absences" element={<AbsenceManagementPage />} />
        </Route>

        {/* --- Ruta 404 (Opcional pero recomendada) --- */}
        {/* Ya no redirige, sino que puede mostrar una página de "No Encontrado" */}
        <Route path="*" element={<h1>404: Página No Encontrada</h1>} />
      </Routes>
      <Toaster />
    </>
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
