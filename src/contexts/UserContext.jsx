import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  CEO: 'CEO',
  SUPERVISOR: 'SUPERVISOR',
  WORKER: 'TECNICO',
  DEVELOPER: 'DESARROLLADOR',
};

const MOCKED_USER = {
  id: '1393925d-655f-4c09-b82d-4c8aa2b196bb',
  supabase_id: '1393925d-655f-4c09-b82d-4c8aa2b196bb',
  db_id: '1393925d-655f-4c09-b82d-4c8aa2b196bb',
  name: 'Usuario Simulado',
  role: ROLES.ADMIN, 
  email: 'admin@evoltion.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=mocked_user',
  estado: 'aceptado',
};

export const UserProvider = ({ children }) => {
  const [user] = useState(MOCKED_USER);
  const [loadingAuth] = useState(false); 

  const login = (appUser) => {
    console.log("Mock login called with:", appUser);
  };

  const logout = async () => {
    console.log("Mock logout called.");
  };
  
  const updateUserRole = async (userIdToUpdate, newRole) => {
    console.log(`Mock updateUserRole called for userId: ${userIdToUpdate} to role: ${newRole}`);
  };

  const fetchUserProfile = async (authUser) => {
    console.log("Mock fetchUserProfile called with:", authUser);
    return MOCKED_USER;
  };

  const setLoadingAuth = (loading) => {
    console.log("Mock setLoadingAuth called with:", loading);
  };

  const value = {
    user,
    loadingAuth,
    ROLES,
    login,
    logout,
    updateUserRole,
    fetchUserProfile,
    setLoadingAuth
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};