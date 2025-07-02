import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";

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
  const [isOtherProject, setIsOtherProject] = useState(false);

  useEffect(() => {
    if (activeProjectId)
      localStorage.setItem("activeProjectId", activeProjectId);
    else localStorage.removeItem("activeProjectId");
  }, [activeProjectId]);

  useEffect(() => {
      localStorage.setItem("isOtherProject", isOtherProject);
    }, [isOtherProject]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Esta función solo se ejecutará si tenemos un usuario logueado.
    if (user) {
      const findTodaysProject = async () => {
        // Obtenemos la fecha de hoy en formato YYYY-MM-DD
        const todayString = format(new Date(), "yyyy-MM-dd");

        // Buscamos en 'planificaciones' una entrada para el usuario y la fecha de hoy.
        const { data, error } = await supabase
          .from("planificaciones")
          .select(`proyecto_id`)
          .eq("usuario_id", user.id)
          .eq("assignment_date", todayString)
          .limit(1) // Nos quedamos con la primera que encontremos para el día
          .single(); // Esperamos un solo resultado

        if (error) {
          // Si hay un error (ej. no se encontró ninguna fila), no es crítico. Lo mostramos en consola.
          console.log(
            `No se encontró planificación para el usuario ${user.id} en la fecha ${todayString}.`
          );
        }

        if (data && data.proyecto_id) {
          // Si encontramos un proyecto, lo establecemos como activo.
          console.log(
            `Proyecto del día encontrado: ${data.proyecto_id}. Estableciendo como activo.`
          );
          setActiveProjectId(data.proyecto_id);
        }
      };

      // Si no hay ya un proyecto activo (quizás de localStorage o seleccionado manualmente),
      // intentamos buscar el del día.
      if (!activeProjectId) {
        findTodaysProject();
      }
    } else {
      // Si el usuario cierra sesión, limpiamos el proyecto activo
      setActiveProjectId(null);
      localStorage.removeItem("activeProjectId");
    }
  }, [user]); // Se dispara cad

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

          if (userProfile.estado === "Aceptado") {
            setUser({ ...session.user, ...userProfile });
          } else {
            let errorMessage = "Tu cuenta tiene un estado inválido.";
            if (userProfile.estado === "Pendiente")
              errorMessage = "Tu cuenta está pendiente de aprobación.";
            if (userProfile.estado === "Rechazado")
              errorMessage = "Tu solicitud de acceso fue rechazada.";

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
      setActiveProjectId(null);
    }
  }, [user]);

  const login = async ({ email, password }) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const clearAuthError = () => setAuthError(null);

  const setCurrentActiveProject = (projectId) => {
    if (projectId === 'OTRO') {
      setIsOtherProject(true);
      setActiveProjectId(null);
    } else {
      setIsOtherProject(false);
      setActiveProjectId(projectId);
    }
  };

  const clearActiveProject = () => {
    setActiveProjectId(null);
    setIsOtherProject(false);
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
    isOtherProject
  };

  return (
    <UserContext.Provider value={value}>
      {!loadingAuth && children}
    </UserContext.Provider>
  );
};
