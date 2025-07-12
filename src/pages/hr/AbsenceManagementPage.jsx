import React, { useState, useEffect, useCallback, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
registerLocale("es", es);
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import DataTable from "@/components/ui/data-table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";
import {
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // --- ESTADOS PARA EL NUEVO FORMULARIO DE DURACIÓN ---
  const [durationMode, setDurationMode] = useState("single"); // Modos: 'half', 'single', 'range'
  const [calculatedDuration, setCalculatedDuration] = useState(0);

  const [formData, setFormData] = useState({
    user_id: user?.id,
    start_date: "",
    end_date: "",
    absence_type: ABSENCE_TYPES[0],
    reason: "",
    status: "SOLICITADA",
    comments_admin: "",
    half_day_period: "am", // 'am' para mañana, 'pm' для tarde
  });

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
        description: "No se pudieron cargar los usuarios.",
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

  // --- useEffect para calcular la duración dinámicamente ---
  useEffect(() => {
    let duration = 0;
    try {
      if (durationMode === "half") {
        duration = formData.start_date ? 0.5 : 0;
      } else if (durationMode === "single") {
        duration = formData.start_date ? 1 : 0;
      } else if (
        durationMode === "range" &&
        formData.start_date &&
        formData.end_date
      ) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        if (end < start) {
          duration = 0;
        } else {
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          duration = diffDays;
        }
      }
    } catch (e) {
      duration = 0; // Si las fechas son inválidas, la duración es 0.
    }
    setCalculatedDuration(duration);
  }, [formData.start_date, formData.end_date, durationMode]);

  const handleDateChange = (fieldName, newDate) => {
    if (newDate) {
      const formattedDate = format(newDate, "yyyy-MM-dd");
      setFormData((prev) => ({ ...prev, [fieldName]: formattedDate }));
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSelectChange = (name, value) =>
    setFormData({ ...formData, [name]: value });
  const handleRadioChange = (value) =>
    setFormData({ ...formData, half_day_period: value });

  const handleDurationModeChange = (value) => {
    if (value) {
      setDurationMode(value);
      setFormData((prev) => ({ ...prev, start_date: "", end_date: "" }));
    }
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
      half_day_period: "am",
    });
    setCurrentAbsence(null);
    setIsModalOpen(false);
    setDurationMode("range");
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
      half_day_period: "am",
    });
    setDurationMode("range");
    setIsModalOpen(true);
  };

  const openModalForEdit = (absence) => {
    // Lógica para determinar el modo de duración al abrir la edición
    const isHalf = absence.is_half_day; // Asumiendo que tienes esta columna en la DB
    const isSingle = absence.start_date === absence.end_date && !isHalf;

    let mode = "range";
    if (isHalf) mode = "half";
    else if (isSingle) mode = "single";

    setDurationMode(mode);
    setCurrentAbsence(absence);
    setFormData({
      user_id: absence.user_id,
      start_date: absence.start_date,
      end_date: absence.end_date,
      absence_type: absence.absence_type,
      reason: absence.reason || "",
      status: absence.status,
      comments_admin: absence.comments_admin || "",
      half_day_period: absence.half_day_period || "am",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Copiamos los datos del formulario para modificarlos antes de guardar
    const dataToSave = { ...formData };

    // Ajustamos la fecha de fin según el modo de duración
    if (durationMode === "half" || durationMode === "single") {
      dataToSave.end_date = dataToSave.start_date;
    }

    // Guardamos si es medio día y qué período es.
    // Necesitarás añadir estas columnas a tu tabla 'absences'
    dataToSave.is_half_day = durationMode === "half";
    dataToSave.half_day_period =
      durationMode === "half" ? formData.half_day_period : null;

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

    if (response.error) {
      toast({
        title: "Error",
        description: `No se pudo guardar la ausencia: ${response.error.message}`,
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

  const finalColumns = useMemo(() => {
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
    let columns = isAdmin
      ? [
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
        ]
      : baseColumns;
    return [
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
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusUpdate(row.id, "RECHAZADA")}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                className="text-primary border-primary hover:bg-primary/10"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ];
  }, [isAdmin, user?.id]);
console.log(formData)
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
          <form onSubmit={handleSubmit} className="space-y-6 py-2">
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
                  <SelectTrigger id="user_id_form" className="mt-1">
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
              <Label>Duración de la Ausencia</Label>
              <ToggleGroup
                type="single"
                value={durationMode}
                onValueChange={handleDurationModeChange}
                className="grid grid-cols-3 mt-1"
              >
                <ToggleGroupItem value="half" aria-label="Medio día">
                  Medio día
                </ToggleGroupItem>
                <ToggleGroupItem value="single" aria-label="Un día">
                  Un día
                </ToggleGroupItem>
                <ToggleGroupItem value="range" aria-label="Varios días">
                  Varios días
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {durationMode === "half" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
              >
                <div className="flex-1">
                  <Label htmlFor="start_date">Fecha</Label>
                  <DatePicker
                    selected={
                      formData.start_date ? new Date(formData.start_date) : null
                    }
                    onChange={(date) => handleDateChange("start_date", date)}
                    dateFormat="dd/MM/yyyy"
                    className="w-full bg-background border border-input rounded-md px-3 py-2"
                    placeholderText="Selecciona una fecha"
                  />
                </div>
                <RadioGroup
                  name="half_day_period"
                  value={formData.half_day_period}
                  onValueChange={handleRadioChange}
                  className="pt-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="am" id="am" />
                    <Label htmlFor="am">Mañana</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pm" id="pm" />
                    <Label htmlFor="pm">Tarde</Label>
                  </div>
                </RadioGroup>
              </motion.div>
            )}

            {durationMode === "single" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Label htmlFor="start_date">Fecha</Label>
                <DatePicker
                  locale="es"
                  selected={
                    formData.start_date ? new Date(formData.start_date) : null
                  }
                  onChange={(date) => handleDateChange("start_date", date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full bg-background border border-input rounded-md px-3 py-2"
                  placeholderText="Selecciona una fecha"
                />
              </motion.div>
            )}

            {durationMode === "range" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <Label htmlFor="start_date">Empezando desde</Label>
                  <DatePicker
                    locale="es" // Usar el idioma español
                    selected={
                      formData.start_date ? new Date(formData.start_date) : null
                    }
                    onChange={(date) => handleDateChange("start_date", date)} // Necesitas una función que maneje el objeto Date
                    dateFormat="dd/MM/yyyy"
                    className="w-full bg-background border border-input rounded-md px-3 py-2" // <-- ¡Puedes aplicar tus clases de Tailwind!
                    placeholderText="Selecciona una fecha"
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Acabando en</Label>
                  <DatePicker
                    locale="es" // Usar el idioma español
                    selected={
                      formData.end_date ? new Date(formData.end_date) : null
                    }
                    onChange={(date) => handleDateChange("end_date", date)} // Necesitas una función que maneje el objeto Date
                    dateFormat="dd/MM/yyyy"
                    className="w-full bg-background border border-input rounded-md px-3 py-2" // <-- ¡Puedes aplicar tus clases de Tailwind!
                    placeholderText="Selecciona una fecha"
                  />
                </div>
              </motion.div>
            )}
            <div>
              <Label htmlFor="absence_type">Tipo de Ausencia</Label>
              <Select
                name="absence_type"
                value={formData.absence_type}
                onValueChange={(value) =>
                  handleSelectChange("absence_type", value)
                }
              >
                <SelectTrigger id="absence_type" className="mt-1">
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
                className="mt-1"
              />
            </div>

            <div className="text-sm text-muted-foreground pt-2 text-center">
              <p>
                La ausencia tendrá una duración de **{calculatedDuration}{" "}
                {calculatedDuration === 1 ? "día" : "días"}**.
                {formData.absence_type === "VACACIONES" &&
                  ` Se usarán ${calculatedDuration} días de vacaciones.`}
              </p>
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
                    <SelectTrigger id="status_form" className="mt-1">
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
                    className="mt-1"
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
                  { accessor: "reason", header: "Motivo" },
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
