import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import DataTable from "@/components/ui/data-table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";
import {
  CalendarPlus,
  CheckCircle,
  XCircle,
  Edit,
  Loader2,
  Send,
  PlusCircle,
} from "lucide-react";

const ABSENCE_TYPES = ["VACACIONES", "ENFERMEDAD", "PERSONAL", "OTRO"];
const ABSENCE_STATUSES = ["SOLICITADA", "APROBADA", "RECHAZADA", "CANCELADA"];

const AbsenceManagementPage = () => {
  const { user } = useUser();
  const [absences, setAbsences] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAbsence, setCurrentAbsence] = useState(null);
  const [formData, setFormData] = useState({
    user_id: user?.id,
    start_date: "",
    end_date: "",
    absence_type: ABSENCE_TYPES[0],
    reason: "",
    status: "SOLICITADA",
    comments_admin: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isAdmin =
    user?.rol === "ADMINISTRADOR" ||
    user?.rol === "CEO" ||
    user?.rol === "DESARROLLADOR";

  const fetchAbsences = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from("absences").select(`
    *,
    autor: usuarios!absences_user_id_fkey1 (nombre),
    editor: usuarios!absences_reviewed_by_id_fkey1 (nombre)
  `);
    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }
    query = query.order("start_date", { ascending: false });

    const { data, error } = await query;
    if (error) {
      toast({
        title: "Error",
        description: `No se pudieron cargar las ausencias: ${error.message}`,
        variant: "destructive",
      });
    } else {
      setAbsences(data || []);
    }
    setIsLoading(false);
  }, [toast, isAdmin, user?.id]);

  const fetchUsersForAdmin = useCallback(async () => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre")
      .order("nombre");
    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios para el formulario.",
        variant: "destructive",
      });
    } else {
      setUsersList(data || []);
    }
  }, [toast, isAdmin]);

  useEffect(() => {
    fetchAbsences();
    if (isAdmin) {
      fetchUsersForAdmin();
    }
  }, [fetchAbsences, fetchUsersForAdmin, isAdmin]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const resetFormAndClose = () => {
    setFormData({
      user_id: isAdmin ? "" : user.id,
      start_date: "",
      end_date: "",
      absence_type: ABSENCE_TYPES[0],
      reason: "",
      status: "SOLICITADA",
      comments_admin: "",
    });
    setCurrentAbsence(null);
    setIsModalOpen(false);
  };

  const openModalForCreate = () => {
    setCurrentAbsence(null);
    setFormData({
      user_id: isAdmin ? "" : user.id,
      start_date: "",
      end_date: "",
      absence_type: ABSENCE_TYPES[0],
      reason: "",
      status: "SOLICITADA",
      comments_admin: "",
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (absence) => {
    setCurrentAbsence(absence);
    setFormData({
      user_id: absence.user_id,
      start_date: absence.start_date,
      end_date: absence.end_date,
      absence_type: absence.absence_type,
      reason: absence.reason || "",
      status: absence.status,
      comments_admin: absence.comments_admin || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const dataToSave = {
      user_id: formData.user_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      absence_type: formData.absence_type,
      reason: formData.reason,
      status: formData.status,
    };

    if (isAdmin) {
      dataToSave.comments_admin = formData.comments_admin;
      if (["APROBADA", "RECHAZADA"].includes(formData.status)) {
        dataToSave.reviewed_by_id = user.id;
        dataToSave.reviewed_at = new Date().toISOString();
      }
    }

    let response;
    if (currentAbsence) {
      response = await supabase
        .from("absences")
        .update(dataToSave)
        .eq("id", currentAbsence.id)
        .select()
        .single();
    } else {
      response = await supabase
        .from("absences")
        .insert(dataToSave)
        .select()
        .single();
    }

    const { error } = response;
    if (error) {
      toast({
        title: "Error",
        description: `No se pudo guardar la ausencia: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: currentAbsence ? "Ausencia Actualizada" : "Solicitud Enviada",
        variant: "success",
      });
      fetchAbsences();
      resetFormAndClose();
    }
    setIsLoading(false);
  };

  const handleStatusUpdate = async (absenceId, newStatus) => {
    setIsLoading(true);
    const { error } = await supabase
      .from("absences")
      .update({
        status: newStatus,
        reviewed_by_id: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", absenceId);

    if (error) {
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Estado Actualizado",
        description: `La ausencia ahora está ${newStatus}.`,
        variant: "success",
      });
      fetchAbsences();
    }
    setIsLoading(false);
  };

  const columns = useMemo(() => {
    const baseColumns = [
      { header: "Tipo", accessor: "absence_type", sortable: true },
      { header: "Desde", accessor: "start_date", sortable: true },
      { header: "Hasta", accessor: "end_date", sortable: true },
      { header: "Motivo", accessor: "reason" },
      {
        header: "Estado",
        accessor: "status",
        sortable: true,
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              row.status === "APROBADA"
                ? "bg-green-100 text-green-700"
                : row.status === "RECHAZADA"
                ? "bg-red-100 text-red-700"
                : row.status === "SOLICITADA"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {row.status}
          </span>
        ),
      },
    ];

    if (isAdmin) {
      return [
        {
          header: "Empleado",
          accessor: "autor.nombre",
          cell: ({ row }) => row.autor?.nombre || "Desconocido",
          sortable: true,
        },
        ...baseColumns,
        {
          header: "Revisado por",
          accessor: "editor.nombre",
          cell: ({ row }) => row.editor?.nombre || "N/A",
        },
      ];
    }

    return baseColumns;
  }, [isAdmin]);

  const finalColumns = useMemo(
    () => [
      ...columns,
      {
        header: "Acciones",
        accessor: "actions",
        cell: ({ row }) => (
          <div className="flex space-x-1">
            {isAdmin && row.status === "SOLICITADA" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusUpdate(row.id, "APROBADA")}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1"
                >
                  <CheckCircle className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusUpdate(row.id, "RECHAZADA")}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </>
            )}
            {(isAdmin ||
              (row.user_id === user.id && row.status === "SOLICITADA")) && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => openModalForEdit(row)}
                className="text-primary border-primary hover:bg-primary/10 p-1"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [columns, isAdmin, user?.id]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-1"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">
          Gestión de Ausencias
        </h1>
        <Button
          onClick={openModalForCreate}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2"
        >
          {isAdmin ? (
            <PlusCircle className="h-5 w-5" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          {isAdmin ? "Registrar Ausencia" : "Solicitar Ausencia"}
        </Button>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) resetFormAndClose();
          else setIsModalOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary text-2xl">
              {currentAbsence
                ? "Editar Ausencia"
                : isAdmin
                ? "Registrar Nueva Ausencia"
                : "Solicitar Ausencia"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {isAdmin && (
              <div>
                <Label htmlFor="user_id_form">Empleado</Label>
                <Select
                  name="user_id"
                  value={formData.user_id}
                  onValueChange={(value) =>
                    handleSelectChange("user_id", value)
                  }
                  required={isAdmin}
                >
                  <SelectTrigger
                    id="user_id_form"
                    className="mt-1 bg-background border-input"
                  >
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersList.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="start_date">Fecha de Inicio</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                className="mt-1 bg-background border-input"
              />
            </div>
            <div>
              <Label htmlFor="end_date">Fecha de Fin</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
                className="mt-1 bg-background border-input"
              />
            </div>
            <div>
              <Label htmlFor="absence_type">Tipo de Ausencia</Label>
              <Select
                name="absence_type"
                value={formData.absence_type}
                onValueChange={(value) =>
                  handleSelectChange("absence_type", value)
                }
              >
                <SelectTrigger
                  id="absence_type"
                  className="mt-1 bg-background border-input"
                >
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ABSENCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className="mt-1 bg-background border-input"
              />
            </div>
            {isAdmin && (
              <>
                <div>
                  <Label htmlFor="status_form">Estado</Label>
                  <Select
                    name="status"
                    value={formData.status}
                    onValueChange={(value) =>
                      handleSelectChange("status", value)
                    }
                  >
                    <SelectTrigger
                      id="status_form"
                      className="mt-1 bg-background border-input"
                    >
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ABSENCE_STATUSES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="comments_admin">Comentarios Admin</Label>
                  <Textarea
                    id="comments_admin"
                    name="comments_admin"
                    value={formData.comments_admin}
                    onChange={handleInputChange}
                    className="mt-1 bg-background border-input"
                  />
                </div>
              </>
            )}
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
                {currentAbsence
                  ? "Guardar Cambios"
                  : isAdmin
                  ? "Registrar Ausencia"
                  : "Enviar Solicitud"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading && absences.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : (
        <DataTable
          key={isAdmin ? "admin-absences" : "user-absences"}
          columns={finalColumns}
          data={absences}
          searchableColumns={
            isAdmin
              ? [
                  { accessor: "autor.nombre", header: "Empleado" },
                  { accessor: "reason", header: "Motivo" }
                ]
              : [{ accessor: "reason", header: "Motivo" }]
          }
          filterableColumns={[
            { accessor: "status", header: "Estado" },
            { accessor: "absence_type", header: "Tipo" },
          ]}
        />
      )}
    </motion.div>
  );
};

export default AbsenceManagementPage;
