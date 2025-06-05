import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useUser as useAuthUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  UserCheck,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES } from "@/contexts/UserContext";

const UserManagement = () => {
  const { user: adminAuthUser, loading: userAuthLoading } = useAuthUser();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState([]);
  const [usersForReview, setUsersForReview] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [actionType, setActionType] = useState(""); // 'aceptado', 'rechazado', 'delete'
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ nombre: "", rol: "" });

  const fetchAllSystemUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("usuarios")
        .select("*");

      if (fetchError) throw fetchError;

      if (Array.isArray(data)) {
        setAllUsers(data);
        setUsersForReview(
          data.filter(
            (u) => u.estado === "pendiente" || u.estado === "rechazado"
          )
        );
        setApprovedUsers(
          data.filter(
            (u) =>
              u.rol === ROLES.ADMIN ||
              u.estado === ROLES.CEO ||
              u.estado === ROLES.SUPERVISOR ||
              u.estado === ROLES.WORKER ||
              u.estado === ROLES.DEVELOPER ||
              u.estado === "aceptado"
          )
        );
      } else {
        setAllUsers([]);
        setUsersForReview([]);
        setApprovedUsers([]);
        console.warn("Received non-array data from get-all-users:", data);
        setError("Formato de datos inesperado del servidor.");
      }
    } catch (e) {
      console.error("Error fetching users:", e);
      setError(`Error al cargar usuarios: ${e.message}`);
      toast({
        title: "Error de Carga",
        description: `No se pudieron cargar los usuarios. ${e.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!userAuthLoading) {
      fetchAllSystemUsers();
    }
  }, [fetchAllSystemUsers, userAuthLoading]);

  const openConfirmationDialog = (userToAction, typeOfAction) => {
    setSelectedUserForAction(userToAction);
    setActionType(typeOfAction);
    setIsConfirmDialogOpen(true);
  };

  const closeConfirmationDialog = () => {
    setSelectedUserForAction(null);
    setActionType("");
    setIsConfirmDialogOpen(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedUserForAction || !actionType || actionType === "delete")
      return;

    const targetUserId = selectedUserForAction.id;
    const newStatus = actionType;

    const originalUsers = [...allUsers];
    setAllUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === targetUserId
          ? { ...u, estado: newStatus, rol: u.rol_solicitado || u.rol }
          : u
      )
    );

    closeConfirmationDialog();

    try {
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({
          estado: newStatus,
          rol:
            selectedUserForAction.rol_solicitado || selectedUserForAction.rol,
        })
        .eq("id", targetUserId);

      if (updateError) throw updateError;

      toast({
        title: "Estado Actualizado",
        description: `El estado de ${selectedUserForAction.nombre} ha sido actualizado a ${newStatus}.`,
        variant: "success",
      });
      fetchAllSystemUsers();
    } catch (e) {
      console.error("Error updating user status:", e);
      setError(`Error al actualizar estado: ${e.message}`);
      toast({
        title: "Error al Actualizar",
        description: `No se pudo actualizar el estado. ${e.message}`,
        variant: "destructive",
      });
      setAllUsers(originalUsers);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserForAction || actionType !== "delete") return;

    const targetUserId = selectedUserForAction.user_id;
    const originalUsers = [...allUsers];
    setAllUsers((prevUsers) =>
      prevUsers.filter((u) => u.user_id !== targetUserId)
    );
    closeConfirmationDialog();

    try {
      const { error: deleteError } = await supabase
        .from("usuarios")
        .update({ estado: "deleted_by_admin" })
        .eq("id", targetUserId);

      if (deleteError) throw deleteError;

      toast({
        title: "Usuario Eliminado",
        description: `El usuario ${selectedUserForAction.nombre} ha sido marcado para eliminación.`,
        variant: "success",
      });
      fetchAllSystemUsers();
    } catch (e) {
      console.error("Error deleting user:", e);
      toast({
        title: "Error al Eliminar",
        description: `No se pudo eliminar el usuario. ${e.message}`,
        variant: "destructive",
      });
      setAllUsers(originalUsers);
    }
  };

  const openEditModal = (userToEdit) => {
    setEditingUser(userToEdit);
    setEditFormData({
      nombre: userToEdit.nombre,
      rol: userToEdit.rol,
      email: userToEdit.email,
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFormRoleChange = (value) => {
    setEditFormData((prev) => ({ ...prev, rol: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const originalUsers = [...allUsers];
    setAllUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.user_id === editingUser.user_id ? { ...u, ...editFormData } : u
      )
    );
    setIsEditModalOpen(false);

    try {
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({ nombre: editFormData.nombre, rol: editFormData.rol })
        .eq("user_id", editingUser.user_id);

      if (updateError) throw updateError;

      toast({
        title: "Usuario Actualizado",
        description: `Los datos de ${editFormData.nombre} han sido actualizados.`,
        variant: "success",
      });
      fetchAllSystemUsers(); // Re-fetch
    } catch (e) {
      console.error("Error updating user:", e);
      toast({
        title: "Error al Actualizar",
        description: `No se pudo actualizar el usuario. ${e.message}`,
        variant: "destructive",
      });
      setAllUsers(originalUsers); // Rollback
    }
    setEditingUser(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ROLES.ADMIN:
      case ROLES.CEO:
      case ROLES.SUPERVISOR:
      case ROLES.WORKER:
      case ROLES.DEVELOPER:
      case "aceptado":
        return "text-green-500 bg-green-100/80 dark:bg-green-700/30 dark:text-green-400";
      case ROLES.PENDING:
        return "text-yellow-500 bg-yellow-100/80 dark:bg-yellow-700/30 dark:text-yellow-400";
      case ROLES.REJECTED:
        return "text-red-500 bg-red-100/80 dark:bg-red-700/30 dark:text-red-400";
      default:
        return "text-gray-500 bg-gray-100/80 dark:bg-gray-700/30 dark:text-gray-400";
    }
  };

  const getActionIcon = (action) => {
    if (action === "aceptado") return <CheckSquare className="mr-1 h-4 w-4" />;
    if (action === "rechazado") return <XSquare className="mr-1 h-4 w-4" />;
    if (action === "delete") return <Trash2 className="mr-1 h-4 w-4" />;
    return <ShieldQuestion className="mr-1 h-4 w-4" />;
  };

  const renderUserTable = (
    userData,
    title,
    showReviewActions = false,
    showEditDelete = false
  ) => {
    if (isLoading && userData.length === 0 && !error) {
      return (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">
            Cargando {title.toLowerCase()}...
          </p>
        </div>
      );
    }

    if (userData.length === 0 && !isLoading && !error) {
      return (
        <div className="p-6 text-center bg-card border border-border rounded-lg shadow-sm">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <h3 className="text-xl font-semibold text-foreground mb-1">
            Todo en orden
          </h3>
          <p className="text-muted-foreground text-sm">
            No hay {title.toLowerCase()} para mostrar.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <h2 className="text-xl font-semibold p-4 border-b border-border">
          {title}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Rol
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Registrado
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {userData.map((user, index) => (
                <motion.tr
                  key={user.user_id || user.id || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-muted/30 transition-colors duration-150"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                    {user.nombre}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {user.email || "N/A"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground capitalize">
                    {user.rol_solicitado || user.rol}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                        user.estado
                      )}`}
                    >
                      {user.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                    {adminAuthUser && user.user_id !== adminAuthUser.id && (
                      <>
                        {showReviewActions && user.estado === 'pendiente' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-100/50 dark:hover:bg-green-700/20 h-8 w-8"
                              onClick={() =>
                                openConfirmationDialog(user, "aceptado")
                              }
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-700/20 h-8 w-8"
                              onClick={() =>
                                openConfirmationDialog(user, "rechazado")
                              }
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {showReviewActions &&
                          user.estado === 'rechazado' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-700/20 h-8 w-8"
                              onClick={() =>
                                openConfirmationDialog(user, "aceptado")
                              }
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        {showEditDelete && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-700/20 h-8 w-8"
                              onClick={() => openEditModal(user)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-700/20 h-8 w-8"
                              onClick={() =>
                                openConfirmationDialog(user, "borrado")
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    {adminAuthUser && user.user_id === adminAuthUser.id && (
                      <span className="text-xs text-muted-foreground italic">
                        (Tu cuenta)
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (userAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-xl text-muted-foreground">
          Cargando gestión de usuarios...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-foreground flex items-center">
          <Users className="mr-3 h-7 w-7 text-primary" /> Gestión de Cuentas de
          Usuario
        </h1>
        <Button
          onClick={fetchAllSystemUsers}
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refrescar
        </Button>
      </div>

      {error && !isLoading && (
        <div className="p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {renderUserTable(
        usersForReview,
        "Usuarios Pendientes de Revisión",
        true,
        false
      )}
      {renderUserTable(
        approvedUsers,
        "Usuarios Activos y Aprobados",
        false,
        true
      )}

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              {getActionIcon(actionType)}
              Confirmar Acción:{" "}
              {actionType === "aceptado"
                ? "Aprobar"
                : actionType === "rechazado"
                ? "Rechazar"
                : actionType === "delete"
                ? "Eliminar"
                : ""}{" "}
              Usuario
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres{" "}
              {actionType === "aceptado"
                ? 'aprobar (cambiar estado a "aceptado")'
                : actionType === "rechazado"
                ? 'rechazar (cambiar estado a "rechazado")'
                : actionType === "delete"
                ? "eliminar (esta acción puede ser irreversible)"
                : ""}{" "}
              al usuario{" "}
              <span className="font-semibold">
                {selectedUserForAction?.nombre}
              </span>{" "}
              ({selectedUserForAction?.email})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmationDialog}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={
                actionType === "delete" ? handleDeleteUser : handleStatusUpdate
              }
              className={
                actionType === "aceptado"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : actionType === "rechazado" || actionType === "delete"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }
            >
              {actionType === "aceptado"
                ? "Sí, Aprobar"
                : actionType === "rechazado"
                ? "Sí, Rechazar"
                : actionType === "delete"
                ? "Sí, Eliminar"
                : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario{" "}
              <span className="font-semibold">{editingUser?.nombre}</span>.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={editFormData.nombre}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={editFormData.email}
                  disabled
                  className="col-span-3 bg-muted/50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rol" className="text-right">
                  Rol
                </Label>
                <Select
                  name="rol"
                  value={editFormData.rol}
                  onValueChange={handleEditFormRoleChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ROLES)
                      .filter(
                        (role) =>
                          role !== ROLES.PENDING && role !== ROLES.REJECTED
                      )
                      .map((role) => (
                        <SelectItem
                          key={role}
                          value={role}
                          className="capitalize"
                        >
                          {role}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">Guardar Cambios</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
