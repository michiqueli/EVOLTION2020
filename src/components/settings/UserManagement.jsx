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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserCheck,
  UserPlus,
  Edit,
  UserX,
  RefreshCw,
  Users,
  Loader2,
  CheckSquare,
  XSquare,
  CheckCircle,
  Edit3,
  Trash2,
  ShieldQuestion,
} from "lucide-react";
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
import { useUser } from "@/contexts/UserContext";

const UserManagementPage = () => {
  const { user: adminUser } = useUser();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    rol: "TECNICO",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const USER_ROLES = ["TECNICO", "ADMIN", "DESARROLLADOR", "CEO"];

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);

    // Reemplaza la llamada a supabase.auth.admin con esto:
    const { data: authUsersResponse, error: functionError } =
      await supabase.functions.invoke("manage-users");

    if (functionError) {
      toast({
        title: "Error al invocar la función",
        description: functionError.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // La respuesta de la función es directamente el array de usuarios
    const authUsers = { users: authUsersResponse };

    const { data: profiles, error: profileError } = await supabase
      .from("usuarios")
      .select("*");
    if (profileError) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles de usuario.",
        variant: "destructive",
      });
    }

    const combinedUsers = authUsers.users.map((authUser) => {
      const profile = profiles?.find((p) => p.user_id === authUser.id);
      console.log(profile);
      return {
        id: authUser.id,
        email: authUser.email,
        nombre: profile?.nombre || authUser.user_metadata?.full_name || "N/A",
        role: profile?.rol || "N/A",
        created_at: new Date(authUser.created_at).toLocaleDateString(),
        last_sign_in_at: authUser.last_sign_in_at
          ? new Date(authUser.last_sign_in_at).toLocaleString()
          : "Nunca",
      };
    });

    setUsers(combinedUsers);
    setIsLoading(false);
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
    setFormData({ email: "", password: "", nombre: "", rol: "TECNICO" });
    setCurrentUser(null);
    setIsModalOpen(false);
  };

  const openModalForCreate = () => {
    setCurrentUser(null);
    setFormData({ email: "", password: "", nombre: "", rol: "TECNICO" });
    setIsModalOpen(true);
  };

  const openModalForEdit = (userToEdit) => {
    setCurrentUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      password: "",
      nombre: userToEdit.nombre,
      rol: userToEdit.role,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (currentUser) {
      // Editar usuario
      const authUpdates = {};
      if (formData.password) authUpdates.password = formData.password;
      if (formData.email !== currentUser.email)
        authUpdates.email = formData.email;

      const userMetaDataUpdates = {};
      if (formData.nombre !== currentUser.nombre)
        userMetaDataUpdates.full_name = formData.nombre;

      if (
        Object.keys(updates).length > 0 ||
        Object.keys(userMetaDataUpdates).length > 0
      ) {
        if (Object.keys(userMetaDataUpdates).length > 0) {
          updates.data = userMetaDataUpdates;
        }
        const { error: authUpdateError } =
          await supabase.auth.admin.updateUserById(currentUser.id, updates);
        if (authUpdateError) {
          toast({
            title: "Error",
            description: `Error al actualizar datos de autenticación: ${authUpdateError.message}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      if (
        formData.rol !== currentUser.rol ||
        formData.nombre !== currentUser.nombre
      ) {
        const { error: profileUpdateError } = await supabase
          .from("usuarios")
          .update({ rol: formData.rol, nombre: formData.nombre })
          .eq("id", currentUser.id);

        if (profileUpdateError) {
          toast({
            title: "Error",
            description: `Error al actualizar perfil: ${profileUpdateError.message}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
      toast({
        title: "Usuario Actualizado",
        description: `El usuario ${formData.email} ha sido actualizado.`,
        variant: "success",
      });
    } else {
      // Crear usuario
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true, // O false si quieres enviar email de confirmación
          user_metadata: { full_name: formData.nombre, role: formData.rol },
        });

      if (createError) {
        toast({
          title: "Error",
          description: `Error al crear usuario: ${createError.message}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // El trigger 'on_auth_user_created' debería crear el perfil.
      // Si no, se puede insertar aquí explícitamente:
      // await supabase.from('user_profiles').insert({ id: newUser.user.id, full_name: formData.full_name, role: formData.role });

      toast({
        title: "Usuario Creado",
        description: `El usuario ${formData.email} ha sido creado.`,
        variant: "success",
      });
    }

    fetchUsers();
    resetFormAndClose();
    setIsLoading(false);
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres eliminar al usuario ${userEmail}? Esta acción no se puede deshacer.`
      )
    )
      return;
    setIsLoading(true);
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      toast({
        title: "Error",
        description: `Error al eliminar usuario: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Usuario Eliminado",
        description: `El usuario ${userEmail} ha sido eliminado.`,
        variant: "success",
      });
      fetchUsers();
    }
    setIsLoading(false);
  };

  const columns = [
    { header: "Nombre Completo", accessor: "nombre", sortable: true },
    { header: "Email", accessor: "email", sortable: true },
    { header: "Rol", accessor: "role", sortable: true },
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
            onClick={() => handleDeleteUser(row.id, row.email)}
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
        <h1 className="text-3xl font-bold text-primary">Gestión de Usuarios</h1>
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
                : "Completa el formulario para añadir un nuevo usuario al sistema."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div>
              <Label htmlFor="full_name">Nombre Completo</Label>
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
              <Label htmlFor="role">Rol</Label>
              <Select
                name="role"
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
                <SelectTrigger
                  id="role"
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
          filterableColumns={[{ accessor: "role", header: "Rol" }]}
        />
      )}
    </motion.div>
  );
};

export default UserManagementPage;
