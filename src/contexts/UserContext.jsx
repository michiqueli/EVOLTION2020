import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const ROLES = {
  ADMIN: "ADMINISTRADOR",
  CEO: "CEO",
  SUPERVISOR: "SUPERVISOR",
  WORKER: "TECNICO",
  DEVELOPER: "DESARROLLADOR",
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(() =>
    localStorage.getItem("activeProjectId")
  );
  useEffect(() => {
    if (activeProjectId)
      localStorage.setItem("activeProjectId", activeProjectId);
    else localStorage.removeItem("activeProjectId");
  }, [activeProjectId]);

  const [activeProjectType, setActiveProjectType] = useState(() =>
    localStorage.getItem("activeProjectType")
  );
  useEffect(() => {
    if (activeProjectType)
      localStorage.setItem("activeProjectType", activeProjectType);
    else localStorage.removeItem("activeProjectType");
  }, [activeProjectType]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Efecto #2: Reacciona a los cambios en 'session' para obtener y validar el perfil.
  useEffect(() => {
    const fetchProfileAndSetUser = async () => {
      try {
        setAuthError(null);
        if (session) {
          const { data: userProfile, error } = await supabase
            .from("usuarios")
            .select("*")
            .eq("user_id", session.user.id)
            .single();

          if (error) throw error;

          if (userProfile.estado === "aceptado") {
            setUser({ ...session.user, ...userProfile });
          } else {
            let errorMessage = "Tu cuenta tiene un estado inválido.";
            if (userProfile.estado === "pendiente") errorMessage = "Tu cuenta está pendiente de aprobación.";
            if (userProfile.estado === "rechazado") errorMessage = "Tu solicitud de acceso fue rechazada.";
            
            setAuthError(errorMessage);
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error al procesar el perfil:", error);
        setUser(null);
      } finally {
        setLoadingAuth(false);
      }
    };
    
    fetchProfileAndSetUser();
  }, [session]);
  

  useEffect(() => {
    if (!user) {
      localStorage.removeItem("activeProjectId");
      localStorage.removeItem("activeProjectType");
      setActiveProjectId(null);
      setActiveProjectType(null);
    }
  }, [user]);


  const login = async ({ email, password }) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const clearAuthError = () => setAuthError(null);

  const setCurrentActiveProject = (projectId, projectType) => {
    setActiveProjectId(projectId);
    setActiveProjectType(projectType);
  };

  const clearActiveProject = () => {
    setActiveProjectId(null);
    setActiveProjectType(null);
  };

  const value = {
    user,
    loadingAuth,
    authError,
    clearAuthError,
    login,
    logout,
    ROLES,
    activeProjectId,
    setCurrentActiveProject,
    clearActiveProject,
    activeProjectType,
  };

  return (
    <UserContext.Provider value={value}>
      {!loadingAuth && children}
    </UserContext.Provider>
  );
};
