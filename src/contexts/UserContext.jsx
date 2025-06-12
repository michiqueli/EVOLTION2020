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
  // --- NUEVO ESTADO PARA ERRORES DE LÓGICA ---
  const [authError, setAuthError] = useState(null);

  // --- PRIMER useEffect: Sincroniza la sesión con Supabase ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // --- SEGUNDO useEffect: Reacciona a la sesión para obtener y validar el perfil ---
  useEffect(() => {
    // Limpiamos errores anteriores al iniciar un nuevo chequeo
    setAuthError(null);

    if (session) {
      const fetchAndValidateProfile = async () => {
        try {
          const { data: userProfile, error } = await supabase
            .from("usuarios")
            .select("*")
            .eq("user_id", session.user.id)
            .single();

          if (error) throw error;

          // --- LÓGICA DE VALIDACIÓN CENTRALIZADA ---
          if (userProfile.estado !== "aceptado") {
            let errorMessage = "Estado de cuenta inválido. Contacta a soporte.";
            if (userProfile.estado === "pendiente") {
              errorMessage =
                "Tu cuenta está pendiente de aprobación. Te avisaremos cuando esté lista.";
            } else if (userProfile.estado === "rechazado") {
              errorMessage = "Tu solicitud de acceso fue rechazada.";
            }
            // Comunicamos el error a través de nuestro nuevo estado
            setAuthError(errorMessage);
            await supabase.auth.signOut();
            return null;
          }

          return { ...session.user, ...userProfile };
        } catch (error) {
          console.error("Error al obtener perfil:", error);
          setAuthError("No se pudo encontrar tu perfil de usuario.");
          await supabase.auth.signOut();
          return null;
        }
      };

      fetchAndValidateProfile().then((profile) => {
        setUser(profile);
      });
    } else {
      setUser(null);
    }
  }, [session]);

  // La función de login es ahora MUY simple
  const login = async ({ email, password }) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const value = {
    user,
    loadingAuth,
    authError, // Exponemos el nuevo estado de error
    clearAuthError, // Y la función para limpiarlo
    login,
    logout,
    ROLES,
  };

  return (
    <UserContext.Provider value={value}>
      {!loadingAuth && children}
    </UserContext.Provider>
  );
};
