import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserPlus, Edit, Loader2, Trash2, UserCog, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/ui/data-table";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useUser, ROLES } from "@/contexts/UserContext";

const getStatusVariant = (status) => {
  switch (status) {
    case 'Aceptado': return 'success';
    case 'Pendiente': return 'default';
    case 'Rechazado': return 'destructive';
    default: return 'secondary';
  }
};

const UserManagementPage = () => {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({ email: "", password: "", nombre: "", rol: ROLES.WORKER });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const { toast } = useToast();

  const USER_ROLES = Object.values(ROLES);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: authUsers, error: functionError } = await supabase.functions.invoke("manage-users", { method: "GET" });
      if (functionError) throw new Error(`Error de la Edge Function: ${functionError.message}`);
      if (!authUsers || !Array.isArray(authUsers)) throw new Error("La respuesta de la función no fue una lista de usuarios válida.");

      const { data: profiles, error: profileError } = await supabase.from("usuarios").select("*");
      if (profileError) throw new Error(`Error al obtener perfiles: ${profileError.message}`);
      
      const profileMap = new Map(profiles.map(p => [p.user_id, p]));
      const combinedUsers = authUsers.map((authUser) => {
        const profile = profileMap.get(authUser.id);
        return {
          id: authUser.id,
          email: authUser.email,
          nombre: profile?.nombre || "No especificado",
          rol: profile?.rol || "No asignado",
          estado: profile?.estado || "Sin Perfil",
          created_at: new Date(authUser.created_at).toLocaleDateString("es-AR"),
          last_sign_in_at: authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString("es-AR") : "Nunca",
        };
      });
      setUsers(combinedUsers);
    } catch (error) {
      console.error("Fallo en fetchUsers:", error);
      toast({ title: "Error al cargar datos", description: error.message, variant: "destructive" });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user.rol === ROLES.ADMIN || user.rol === ROLES.DEVELOPER || user.rol === ROLES.CEO ) fetchUsers();
  }, [user, fetchUsers]);

  const handleUserStatusUpdate = async (userId, updates, successMessage) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase.from('usuarios').update(updates).eq('user_id', userId);
      if (error) throw error;
      toast({ title: successMessage, variant: "success" });
      await fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: `No se pudo actualizar el usuario: ${error.message}`, variant: "destructive" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAcceptUser = (userId) => {
    handleUserStatusUpdate(userId, { estado: 'Aceptado', rol: ROLES.WORKER }, "Usuario aceptado y activado.");
  };

  const handleRejectUser = (userId) => {
    handleUserStatusUpdate(userId, { estado: 'Rechazado', rol: null }, "Usuario rechazado.");
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSelectChange = (name, value) => setFormData({ ...formData, [name]: value });

  const resetFormAndClose = () => {
    setFormData({ email: "", password: "", nombre: "", rol: ROLES.WORKER });
    setCurrentUser(null);
    setIsModalOpen(false);
  };

  const openModalForCreate = () => {
    setCurrentUser(null);
    setFormData({ email: "", password: "", nombre: "", rol: ROLES.WORKER });
    setIsModalOpen(true);
  };

  const openModalForEdit = (userToEdit) => {
    setCurrentUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      password: "",
      nombre: userToEdit.nombre,
      rol: userToEdit.rol,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    // ... tu lógica handleSubmit existente para crear/editar ...
  };

  const handleDeleteUser = async (user) => {
    // ... tu lógica handleDeleteUser existente ...
  };

  const columns = [
    { header: "Nombre Completo", accessor: "nombre", sortable: true },
    { header: "Email", accessor: "email", sortable: true },
    { header: "Rol", accessor: "rol", sortable: true, cell: ({ row }) => row.rol || <span className="italic text-muted-foreground">Sin asignar</span> },
    { 
      header: "Estado", 
      accessor: "estado", 
      sortable: true,
      cell: ({ row }) => <Badge variant={getStatusVariant(row.estado)}>{row.estado}</Badge>
    },
    { header: "Último Acceso", accessor: "last_sign_in_at", sortable: true },
    {
      header: "Acciones",
      accessor: "actions",
      cell: ({ row }) => (
        <div className="flex space-x-2 justify-end">
          {updatingUserId === row.id ? <Loader2 className="h-5 w-5 animate-spin" /> :
            row.estado === 'Pendiente' ? (
            <>
              <Button size="sm" onClick={() => handleAcceptUser(row.id)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <CheckCircle className="h-4 w-4" /> Aceptar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleRejectUser(row.id)} className="gap-2">
                <XCircle className="h-4 w-4" /> Rechazar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => openModalForEdit(row)} className="gap-1.5">
                <Edit className="h-4 w-4" /> Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => { setUserToDelete(row); setIsDeleteDialogOpen(true); }} disabled={row.id === user.id} className="gap-1.5">
                <Trash2 className="h-4 w-4" /> Eliminar
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground flex items-center">
          <UserCog className="mr-3 h-7 w-7 text-primary" />
          Gestión de Usuarios
        </h1>
        <Button onClick={openModalForCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Crear Usuario
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isOpen) resetFormAndClose(); else setIsModalOpen(true); }}>
        <DialogContent className="sm:max-w-[525px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary text-2xl">{currentUser ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
            <DialogDescription>{currentUser ? "Modifica los detalles del usuario." : "Completa el formulario para añadir un nuevo usuario."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div>
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required className="mt-1 bg-background" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required className="mt-1 bg-background" />
            </div>
            <div>
              <Label htmlFor="password">{currentUser ? "Nueva Contraseña (opcional)" : "Contraseña"}</Label>
              <PasswordInput id="password" name="password" value={formData.password} onChange={handleInputChange} required={!currentUser} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="rol">Rol</Label>
              <Select name="rol" value={formData.rol} onValueChange={(value) => handleSelectChange("rol", value)}>
                <SelectTrigger id="rol" className="mt-1 bg-background"><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                <SelectContent>{USER_ROLES.map((role) => (<SelectItem key={role} value={role}>{role}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetFormAndClose} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentUser ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente al usuario{" "}
              <span className="font-bold text-primary">{userToDelete?.email}</span> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteUser(userToDelete)}>Sí, eliminar usuario</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading && users.length === 0 ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchableColumns={[{ accessor: "nombre", header: "Nombre" }, { accessor: "email", header: "Email" }]}
          filterableColumns={[{ accessor: "rol", header: "Rol" }, { accessor: "estado", header: "Estado" }]}
        />
      )}
    </motion.div>
  );
};

export default UserManagementPage;