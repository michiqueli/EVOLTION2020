import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useUser, ROLES } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserCheck, UserX, RefreshCw, Users, Loader2, CheckSquare, XSquare, CheckCircle } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminUsersPage = () => {
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [actionType, setActionType] = useState(''); // 'aceptado' or 'rechazado'

  const fetchUsers = useCallback(async () => {
    if (!adminUser || !adminUser.id) {
      setError("No se pudo verificar la sesión del administrador.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error(sessionError?.message || "No hay sesión activa.");
      }
      const token = sessionData.session.access_token;

      const { data, error: fetchError } = await supabase.functions.invoke('get-all-users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (fetchError) throw fetchError;
      
      if (Array.isArray(data)) {
         setUsers(data);
         // Filter users to show only 'pendiente' or 'rechazado'
         setFilteredUsers(data.filter(u => u.estado === 'pendiente' || u.estado === 'rechazado'));
      } else {
        setUsers([]);
        setFilteredUsers([]);
        console.warn("Received non-array data from get-all-users:", data);
        setError("Formato de datos inesperado del servidor.");
      }

    } catch (e) {
      console.error("Error fetching users:", e);
      setError(`Error al cargar usuarios: ${e.message}`);
      toast({ title: "Error de Carga", description: `No se pudieron cargar los usuarios. ${e.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [adminUser, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateUserStatus = async (targetUserId, newStatus) => {
    if (!selectedUserForAction) return;
    
    // Optimistically update UI
    const previousUsers = [...users];
    const previousFilteredUsers = [...filteredUsers];

    setUsers(prevUsers => 
      prevUsers.map(u => u.user_id === targetUserId ? { ...u, estado: newStatus } : u)
    );
    setFilteredUsers(prevFiltered => 
        prevFiltered.map(u => u.user_id === targetUserId ? { ...u, estado: newStatus } : u)
                    .filter(u => u.estado === 'pendiente' || u.estado === 'rechazado') // Re-filter after optimistic update
    );


    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error(sessionError?.message || "No hay sesión activa.");
      }
      const token = sessionData.session.access_token;

      const { error: updateError } = await supabase.functions.invoke('update-user-status', {
        body: { target_user_id: targetUserId, new_status: newStatus },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (updateError) throw updateError;

      toast({
        title: "Estado Actualizado",
        description: `El estado de ${selectedUserForAction.nombre} ha sido actualizado a ${newStatus}.`,
        variant: "success",
      });
      // Data is already optimistically updated, but a full refresh ensures consistency if needed
      // For now, rely on optimistic update. If issues, uncomment fetchUsers().
      // fetchUsers(); 
      setSelectedUserForAction(null); 
      setActionType('');

    } catch (e) {
      console.error("Error updating user status:", e);
      setError(`Error al actualizar estado: ${e.message}`);
      toast({ title: "Error al Actualizar", description: `No se pudo actualizar el estado. ${e.message}`, variant: "destructive" });
      // Rollback optimistic update
      setUsers(previousUsers);
      setFilteredUsers(previousFilteredUsers);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'aceptado': return 'text-green-500 bg-green-100/80 dark:bg-green-700/30 dark:text-green-400';
      case 'pendiente': return 'text-yellow-500 bg-yellow-100/80 dark:bg-yellow-700/30 dark:text-yellow-400';
      case 'rechazado': return 'text-red-500 bg-red-100/80 dark:bg-red-700/30 dark:text-red-400';
      default: return 'text-gray-500 bg-gray-100/80 dark:bg-gray-700/30 dark:text-gray-400';
    }
  };

  const getActionIcon = (action) => {
    if (action === 'aceptado') return <CheckSquare className="mr-1 h-4 w-4" />;
    if (action === 'rechazado') return <XSquare className="mr-1 h-4 w-4" />;
    return null;
  };

  if (isLoading && filteredUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-xl text-muted-foreground">Cargando usuarios para revisión...</p>
      </div>
    );
  }
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" }
    })
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" /> Revisión de Usuarios
          </h1>
          <p className="text-md text-muted-foreground mt-1">Aprueba o rechaza las solicitudes de nuevos usuarios.</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refrescar Lista
        </Button>
      </div>

      {error && !isLoading && (
         <div className="p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-300">
           {error}
         </div>
      )}

      {filteredUsers.length === 0 && !isLoading && !error && (
        <div className="p-8 text-center bg-card border border-border rounded-lg shadow-md">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Todo al día</h2>
            <p className="text-muted-foreground">No hay usuarios pendientes de revisión o rechazados actualmente.</p>
        </div>
      )}

      {filteredUsers.length > 0 && (
        <div className="overflow-x-auto bg-card border border-border rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol Solicitado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado Actual</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Registrado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredUsers.map((user, index) => (
                <motion.tr 
                  key={user.id} 
                  variants={cardVariants} 
                  initial="hidden" 
                  animate="visible" 
                  custom={index}
                  className="hover:bg-muted/30 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{user.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">{user.rol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(user.estado)}`}>
                      {user.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {user.user_id !== adminUser?.id && (user.estado === 'pendiente' || user.estado === 'rechazado') && (
                      <>
                        {user.estado === 'pendiente' && (
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-700/30"
                                onClick={() => {setSelectedUserForAction(user); setActionType('aceptado');}}
                              >
                                <UserCheck className="mr-1 h-4 w-4" /> Aprobar
                              </Button>
                            </AlertDialogTrigger>
                          </AlertDialog>
                        )}
                        {/* Always show "Rechazar" if pending, or "Aprobar" if rejected to allow re-approval */}
                        {user.estado === 'pendiente' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-700/30"
                                onClick={() => {setSelectedUserForAction(user); setActionType('rechazado');}}
                              >
                                <UserX className="mr-1 h-4 w-4" /> Rechazar
                              </Button>
                            </AlertDialogTrigger>
                          </AlertDialog>
                        )}
                         {user.estado === 'rechazado' && (
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-700/30"
                                onClick={() => {setSelectedUserForAction(user); setActionType('aceptado');}}
                              >
                                <UserCheck className="mr-1 h-4 w-4" /> Re-Aprobar
                              </Button>
                            </AlertDialogTrigger>
                          </AlertDialog>
                        )}
                      </>
                    )}
                    {user.user_id === adminUser?.id && (
                      <span className="text-xs text-muted-foreground italic">(Tu cuenta)</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
       <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {getActionIcon(actionType)}
            Confirmar Acción: {actionType === 'aceptado' ? 'Aprobar' : 'Rechazar'} Usuario
            </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres <span className="font-semibold">{actionType === 'aceptado' ? 'aprobar (cambiar estado a "aceptado")' : 'rechazar (cambiar estado a "rechazado")'}</span> al usuario <span className="font-semibold">{selectedUserForAction?.nombre}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSelectedUserForAction(null)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => handleUpdateUserStatus(selectedUserForAction?.user_id, actionType)}
            className={actionType === 'aceptado' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {actionType === 'aceptado' ? 'Sí, Aprobar' : 'Sí, Rechazar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </motion.div>
  );
};

export default AdminUsersPage;