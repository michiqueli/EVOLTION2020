import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, Edit, Loader2, Trash2, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/ui/data-table";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useUser, ROLES } from "@/contexts/UserContext"; // Importamos los ROLES del contexto

const UserManagementPage = () => {
  const { user: adminUser } = useUser();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    rol: ROLES.WORKER, // Usamos el valor por defecto del contexto
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const { toast } = useToast();

  const USER_ROLES = Object.values(ROLES);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data: authUsers, error: functionError } =
        await supabase.functions.invoke("manage-users", {
          method: "GET",
        });

      if (functionError) {
        throw new Error(`Error de la Edge Function: ${functionError.message}`);
      }
      if (!authUsers || !Array.isArray(authUsers)) {
        throw new Error(
          "La respuesta de la función no contenía una lista de usuarios válida."
        );
      }

      const { data: profiles, error: profileError } = await supabase
        .from("usuarios")
        .select("*");

      if (profileError) {
        throw new Error(`Error al obtener perfiles: ${profileError.message}`);
      }
      const combinedUsers = authUsers.map((authUser) => {
        const profile = profiles?.find((p) => p.user_id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email,
          nombre: profile?.nombre || "No especificado",
          rol: profile?.rol || "No asignado",
          created_at: new Date(authUser.created_at).toLocaleDateString("es-AR"), // Formato localizado
          last_sign_in_at: authUser.last_sign_in_at
            ? new Date(authUser.last_sign_in_at).toLocaleString("es-AR") // Formato localizado
            : "Nunca",
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error("Fallo en fetchUsers:", error);
      toast({
        title: "Error al cargar los datos",
        description: error.message,
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (adminUser) {
      fetchUsers();
    }
  }, [adminUser, fetchUsers]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

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
    e.preventDefault();
    setIsLoading(true);

    if (currentUser) {
      // --- LÓGICA PARA EDITAR USUARIO ---
      try {
        const authUpdates = {};
        if (formData.password) authUpdates.password = formData.password;
        if (formData.email !== currentUser.email)
          authUpdates.email = formData.email;

        if (Object.keys(authUpdates).length > 0) {
          const { error: authError } = await supabase.functions.invoke(
            "manage-users",
            {
              method: "PATCH",
              body: { userId: currentUser.id, updates: authUpdates },
            }
          );
          if (authError)
            throw new Error(`Error de autenticación: ${authError.message}`);
        }
        if (
          formData.rol !== currentUser.rol ||
          formData.nombre !== currentUser.nombre
        ) {
          const { error: profileError } = await supabase
            .from("usuarios")
            .update({ rol: formData.rol, nombre: formData.nombre })
            .eq("user_id", currentUser.id);

          if (profileError)
            throw new Error(`Error de perfil: ${profileError.message}`);
        }

        toast({
          title: "Usuario Actualizado",
          description: `El usuario ${formData.email} ha sido actualizado con éxito.`,
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Error al actualizar",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      // --- LÓGICA PARA CREAR USUARIO ---
      try {
        const { data: newUserResponse, error: createError } =
          await supabase.functions.invoke("manage-users", {
            method: "POST",
            body: {
              email: formData.email,
              password: formData.password,
              email_confirm: true,
            },
          });

        if (createError) throw new Error(createError.message);
        const { error: profileError } = await supabase.from("usuarios").insert({
          user_id: newUserResponse.id,
          nombre: formData.nombre,
          rol: formData.rol,
          estado: "aceptado",
        });

        if (profileError)
          throw new Error(
            `El usuario de auth fue creado, pero falló la creación del perfil: ${profileError.message}`
          );
        toast({
          title: "Usuario Creado",
          description: `El usuario ${formData.email} ha sido creado con éxito.`,
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Error al crear",
          description: error.message,
          variant: "destructive",
        });
      }
    }

    fetchUsers();
    resetFormAndClose();
    setIsLoading(false);
  };

  const handleDeleteUser = async (user) => {
    if (!user) return;
    setIsLoading(true);
    setIsDeleteDialogOpen(false);

    const { error } = await supabase.functions.invoke(
      `manage-users?userId=${user.id}`,
      {
        method: "DELETE",
      }
    );

    if (error) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Usuario Eliminado",
        description: `El usuario ${user.email} ha sido eliminado con éxito.`,
        variant: "success",
      });
      fetchUsers();
    }

    setIsLoading(false);
    setUserToDelete(null);
  };

  const columns = [
    { header: "Nombre Completo", accessor: "nombre", sortable: true },
    { header: "Email", accessor: "email", sortable: true },
    { header: "Rol", accessor: "rol", sortable: true }, // Corregido a 'rol' para consistencia
    { header: "Creado", accessor: "created_at", sortable: true },
    { header: "Último Acceso", accessor: "last_sign_in_at", sortable: true },
    {
      header: "Acciones",
      accessor: "actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModalForEdit(row)}
            className="text-primary border-primary hover:bg-primary/10"
          >
            <Edit className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setUserToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            disabled={row.id === adminUser?.id}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-1"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground flex items-center">
          <UserCog className="mr-3 h-7 w-7 text-primary" />
          Gestión de Usuarios
        </h1>
        <Button
          onClick={openModalForCreate}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Crear Usuario
        </Button>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) resetFormAndClose();
          else setIsModalOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-[525px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary text-2xl">
              {currentUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {currentUser
                ? "Modifica los detalles del usuario."
                : "Completa el formulario para añadir un nuevo usuario."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div>
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="mt-1 bg-background border-input"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="mt-1 bg-background border-input"
              />
            </div>
            <div>
              <Label htmlFor="password">
                {currentUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
              </Label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!currentUser}
                className="mt-1 bg-background border-input"
              />
            </div>
            <div>
              <Label htmlFor="rol">Rol</Label>
              <Select
                name="rol"
                value={formData.rol}
                onValueChange={(value) => handleSelectChange("rol", value)}
              >
                <SelectTrigger
                  id="rol"
                  className="mt-1 bg-background border-input"
                >
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetFormAndClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentUser ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente al
              usuario
              <span className="font-bold text-primary">
                {" "}
                {userToDelete?.email}
              </span>{" "}
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteUser(userToDelete)}>
              Sí, eliminar usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading && users.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchableColumns={[
            { accessor: "nombre", header: "Nombre" },
            { accessor: "email", header: "Email" },
          ]}
          filterableColumns={[{ accessor: "rol", header: "Rol" }]}
        />
      )}
    </motion.div>
  );
};

export default UserManagementPage;
