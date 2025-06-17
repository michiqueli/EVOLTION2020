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
  PlayCircle,
  StopCircle,
  Edit,
  PlusCircle,
  Loader2,
} from "lucide-react";

const TimeTrackingPage = () => {
  const { user, activeProjectId, setCurrentActiveProject } = useUser();
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);

  const [quickStartNotes, setQuickStartNotes] = useState("");
  const [isOtherProject, setIsOtherProject] = useState(false);
  const [otherProjectDetails, setOtherProjectDetails] = useState("");

  const [modalFormData, setModalFormData] = useState({
    project_id: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "",
    end_time: "",
    is_other_project: false,
    other_project_details: "",
    notes: "",
  });

  const { toast } = useToast();
  const isAdmin =
    user?.rol === "ADMINISTRADOR" ||
    user?.rol === "CEO" ||
    user?.rol === "DESARROLLADOR";

  const fetchTimeEntries = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from("time_tracking").select(`
      *,
      proyectos (nombre),
      autor: usuarios!time_tracking_user_id_fkey (nombre),
      editor: usuarios!time_tracking_edited_by_fkey1 (nombre)`);
    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }
    query = query
      .order("date", { ascending: false })
      .order("start_time", { ascending: false });

    const { data, error } = await query;
    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los fichajes.",
        variant: "destructive",
      });
    } else {
      setTimeEntries(
        data.map((entry) => ({
          ...entry,
          project_name:
            entry.proyectos?.nombre ||
            (entry.is_other_project
              ? `OTROS: ${entry.other_project_details}`
              : "N/A"),
        }))
      );
      const runningTimer = data.find(
        (e) => e.user_id === user.id && !e.end_time
      );
      if (runningTimer) setActiveTimer(runningTimer.id);
      else setActiveTimer(null);
    }
    setIsLoading(false);
  }, [toast, isAdmin, user?.id]);

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("proyectos")
      .select("id, uuid_id, nombre")
      .order("nombre");
    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los proyectos.",
        variant: "destructive",
      });
    } else {
      setProjects(data || []);
    }
  }, [toast]);

  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, [fetchTimeEntries, fetchProjects]);

  const handleActiveProjectChange = (projectId) => {
    if (projectId === "OTROS") {
      setIsOtherProject(true);
      setCurrentActiveProject(null);
    } else {
      setIsOtherProject(false);
      setOtherProjectDetails("");
      setCurrentActiveProject(projectId);
      const project = projects.find((p) => p.uuid_id === projectId);
      if (project) {
        toast({
          title: "Proyecto Activo Cambiado",
          description: `Ahora estás trabajando en "${project.nombre}".`,
          variant: "success",
        });
      }
    }
  };

  // --- FUNCIÓN AUXILIAR para convertir fechas a formato local ---
  const toLocalISOString = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = new Date(date.getTime() - tzoffset)
      .toISOString()
      .slice(0, 16);

    return localISOTime;
  };

  const handleStartTimer = async () => {
    if (activeTimer) return;
    if (!activeProjectId && !isOtherProject) {
      toast({
        title: "Acción Requerida",
        description: "Por favor, selecciona un proyecto para iniciar.",
        variant: "default",
      });
      return;
    }
    if (isOtherProject && !otherProjectDetails.trim()) {
      toast({
        title: "Acción Requerida",
        description: "Añade los detalles del proyecto 'OTROS'.",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("time_tracking")
      .insert({
        user_id: user.id,
        project_id: isOtherProject ? null : activeProjectId,
        date: new Date().toISOString().split("T")[0],
        start_time: new Date().toISOString(),
        is_other_project: isOtherProject,
        other_project_details: isOtherProject ? otherProjectDetails : null,
        notes: quickStartNotes,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: `No se pudo iniciar el fichaje: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Fichaje Iniciado",
        description: "El contador ha comenzado.",
        variant: "success",
      });
      setActiveTimer(data.id);
      setQuickStartNotes("");
      fetchTimeEntries();
    }
    setIsLoading(false);
  };

  const handleStopTimer = async () => {
    if (!activeTimer) {
      toast({
        title: "Error",
        description: "No hay ningún fichaje activo para detener.",
        variant: "warning",
      });
      return;
    }

    setIsLoading(true);

    try {
      // --- PASO 1: Detener el fichaje y obtener la fila actualizada ---
      // Usamos .select() para que Supabase nos devuelva el registro completo que acabamos de actualizar.
      const { data: stoppedEntry, error: stopError } = await supabase
        .from("time_tracking")
        .update({ end_time: new Date().toISOString() })
        .eq("id", activeTimer)
        .select()
        .single();

      if (stopError) {
        // Si falla al detener el timer, lanzamos un error para detener todo el proceso.
        throw new Error(`No se pudo detener el fichaje: ${stopError.message}`);
      }

      toast({ title: "Fichaje Detenido", variant: "success" });
      setActiveTimer(null);
      fetchTimeEntries(); // Refrescamos la lista de fichajes

      // --- PASO 2: Calcular la duración y actualizar el proyecto ---
      // Verificamos que el fichaje detenido tenga un project_id (no sea un proyecto "OTROS")
      if (stoppedEntry && stoppedEntry.project_id) {
        const startTime = new Date(stoppedEntry.start_time);
        const endTime = new Date(stoppedEntry.end_time);

        // Calculamos la duración en milisegundos y la convertimos a horas
        const durationInMilliseconds = endTime - startTime;
        const durationInHours = durationInMilliseconds / (1000 * 60 * 60);

        console.log(
          `Duración calculada: ${durationInHours.toFixed(
            2
          )} horas para el proyecto ${stoppedEntry.project_id}`
        );

        // --- PASO 3: Obtener las horas actuales del proyecto y restarle la duración ---

        // Primero, obtenemos el valor actual de 'horas' del proyecto
        const { data: projectData, error: fetchError } = await supabase
          .from("proyectos")
          .select("horas")
          .eq("uuid_id", stoppedEntry.project_id) // Asumiendo que project_id es el uuid
          .single();

        if (fetchError) {
          throw new Error(
            `No se pudo encontrar el proyecto para actualizar horas: ${fetchError.message}`
          );
        }

        const currentHours = projectData.horas;
        const newHours = currentHours + durationInHours;

        // Finalmente, actualizamos el proyecto con el nuevo total de horas
        const { error: updateProjectError } = await supabase
          .from("proyectos")
          .update({ horas: newHours })
          .eq("uuid_id", stoppedEntry.project_id);

        if (updateProjectError) {
          throw new Error(
            `No se pudieron actualizar las horas del proyecto: ${updateProjectError.message}`
          );
        }

        toast({
          title: "Horas de Proyecto Actualizadas",
          description: `Se descontaron ${durationInHours.toFixed(
            2
          )} horas del proyecto.`,
          variant: "info",
        });
      }
    } catch (error) {
      // Un único lugar para manejar todos los posibles errores del proceso
      toast({
        title: "Ocurrió un Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      // Este bloque se ejecuta siempre, garantizando que el loading se desactive
      setIsLoading(false);
    }
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalSelectChange = (name, value) => {
    setModalFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "project_id" && value === "OTROS") {
      setModalFormData((prev) => ({
        ...prev,
        is_other_project: true,
        project_id: null,
      }));
    } else if (name === "project_id") {
      setModalFormData((prev) => ({ ...prev, is_other_project: false }));
    }
  };

  const resetModalFormAndClose = () => {
    setModalFormData({
      project_id: "",
      date: new Date().toISOString().split("T")[0],
      start_time: "",
      end_time: "",
      is_other_project: false,
      other_project_details: "",
      notes: "",
    });
    setCurrentEntry(null);
    setIsModalOpen(false);
  };

  const openModalForCreate = () => {
    setCurrentEntry(null);
    resetModalFormAndClose();
    setIsModalOpen(true);
  };

  const openModalForEdit = (entry) => {
    setCurrentEntry(entry);
    setModalFormData({
      project_id: entry.project_id || (entry.is_other_project ? "OTROS" : ""),
      date: entry.date,
      start_time: entry.start_time ? toLocalISOString(entry.start_time) : "",
      end_time: entry.end_time ? toLocalISOString(entry.end_time) : "",

      is_other_project: entry.is_other_project,
      other_project_details: entry.other_project_details || "",
      notes: entry.notes || "",
    });
    setIsModalOpen(true);
  };

  // En tu componente TimeTrackingPage.jsx...

  // --- NUEVA FUNCIÓN AUXILIAR 1: Para calcular la duración en horas ---
  // Devuelve 0 si no hay hora de fin, para que no afecte los cálculos.
  const calculateDurationInHours = (startTime, endTime) => {
    if (!startTime || !endTime) {
      return 0;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInMilliseconds = end - start;
    // Retorna el valor en horas, o 0 si el cálculo es inválido (ej. end < start)
    return Math.max(0, durationInMilliseconds / (1000 * 60 * 60));
  };

  // --- NUEVA FUNCIÓN AUXILIAR 2: Para actualizar las horas de un proyecto ---
  // 'hoursToAdjust' puede ser positivo (para sumar) o negativo (para restar).
  const updateProjectHours = async (projectId, hoursToAdjust) => {
    if (!projectId || hoursToAdjust === 0) {
      return; // No hacemos nada si no hay proyecto o el ajuste es cero.
    }

    try {
      // Obtenemos las horas actuales del proyecto. Es una operación atómica en la DB.
      // NOTA: Para máxima robustez en un entorno de alta concurrencia, esto se haría
      // con una función RPC en la base de datos, pero este enfoque es excelente para la mayoría de los casos.
      const { data: project, error: fetchError } = await supabase
        .from("proyectos")
        .select("horas, nombre")
        .eq("uuid_id", projectId)
        .single();

      if (fetchError)
        throw new Error(
          `No se pudo obtener el proyecto para ajustar horas: ${fetchError.message}`
        );

      const newHours = project.horas + hoursToAdjust; // Restamos porque hoursToAdjust representa el "gasto"

      const { error: updateError } = await supabase
        .from("proyectos")
        .update({ horas: newHours })
        .eq("uuid_id", projectId);

      if (updateError)
        throw new Error(
          `No se pudo actualizar el proyecto: ${updateError.message}`
        );

      console.log(
        `Horas del proyecto "${project.nombre}" actualizadas correctamente.`
      );
    } catch (error) {
      // Si la actualización de horas falla, lo notificamos pero no detenemos el flujo principal.
      toast({
        title: "Error al actualizar horas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // --- TU FUNCIÓN handleModalSubmit TOTALMENTE REFACTORIZADA ---
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // --- LÓGICA PARA EDITAR UN FICHAJE EXISTENTE ---
      if (currentEntry) {
        // 1. Calculamos la duración ORIGINAL del fichaje (antes de editar)
        const oldDuration = calculateDurationInHours(
          currentEntry.start_time,
          currentEntry.end_time
        );
        const oldProjectId = currentEntry.project_id;

        // 2. Preparamos y guardamos los NUEVOS datos del fichaje
        const dataToSave = {
          project_id: modalFormData.is_other_project
            ? null
            : modalFormData.project_id,
          date: modalFormData.date,
          start_time: new Date(modalFormData.start_time).toISOString(),
          end_time: modalFormData.end_time
            ? new Date(modalFormData.end_time).toISOString()
            : null,
          is_other_project: modalFormData.is_other_project,
          other_project_details: modalFormData.is_other_project
            ? modalFormData.other_project_details
            : null,
          notes: modalFormData.notes,
          edited_by: isAdmin ? user.id : null,
        };

        const { data: updatedEntry, error } = await supabase
          .from("time_tracking")
          .update(dataToSave)
          .eq("id", currentEntry.id)
          .select()
          .single();

        if (error) throw error; // Si falla aquí, no continuamos.

        // 3. Calculamos la NUEVA duración
        const newDuration = calculateDurationInHours(
          updatedEntry.start_time,
          updatedEntry.end_time
        );
        const newProjectId = updatedEntry.project_id;

        // 4. Lógica de ajuste de horas
        if (oldProjectId === newProjectId) {
          // El proyecto no cambió, solo ajustamos la diferencia
          const durationDelta = newDuration - oldDuration;
          if (newProjectId) {
            await updateProjectHours(newProjectId, durationDelta);
          }
        } else {
          // ¡El proyecto cambió!
          // Devolvemos las horas al proyecto antiguo
          if (oldProjectId) {
            await updateProjectHours(oldProjectId, -oldDuration); // Sumamos las horas de vuelta
          }
          // Restamos las horas del proyecto nuevo
          if (newProjectId) {
            await updateProjectHours(newProjectId, newDuration);
          }
        }

        toast({ title: "Fichaje Actualizado", variant: "success" });
      } else {
        // --- LÓGICA PARA CREAR UN NUEVO FICHAJE MANUAL ---
        const dataToSave = {
          user_id: user.id,
          project_id: modalFormData.is_other_project
            ? null
            : modalFormData.project_id,
          date: modalFormData.date,
          start_time: new Date(modalFormData.start_time).toISOString(),
          end_time: modalFormData.end_time
            ? new Date(modalFormData.end_time).toISOString()
            : null,
          is_other_project: modalFormData.is_other_project,
          other_project_details: modalFormData.is_other_project
            ? modalFormData.other_project_details
            : null,
          notes: modalFormData.notes,
        };

        const { data: newEntry, error } = await supabase
          .from("time_tracking")
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;

        // Si se creó un fichaje ya cerrado, calculamos y restamos las horas
        const duration = calculateDurationInHours(
          newEntry.start_time,
          newEntry.end_time
        );
        if (duration > 0 && newEntry.project_id) {
          await updateProjectHours(newEntry.project_id, duration);
        }

        toast({ title: "Fichaje Creado", variant: "success" });
      }

      // Al final, si todo fue bien, refrescamos y cerramos
      fetchTimeEntries();
      resetModalFormAndClose();
    } catch (error) {
      toast({
        title: "Error al Guardar",
        description: `No se pudo guardar el fichaje: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: "Proyecto", accessor: "project_name", sortable: true },
    { header: "Fecha", accessor: "date", sortable: true },
    {
      header: "Inicio",
      accessor: "start_time",
      cell: ({ row }) =>
        new Date(row.start_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      sortable: true,
    },
    {
      header: "Fin",
      accessor: "end_time",
      cell: ({ row }) =>
        row.end_time
          ? new Date(row.end_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "En curso",
      sortable: true,
    },
    { header: "Notas", accessor: "notes" },
  ];

  if (isAdmin) {
    columns.unshift({
      header: "Usuario",
      accessor: "usuarios.nombre",
      cell: ({ row }) => row.autor?.nombre || "Desconocido",
      sortable: true,
    });
    columns.push({
      header: "Acciones",
      accessor: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openModalForEdit(row)}
          className="text-primary border-primary hover:bg-primary/10"
        >
          <Edit className="h-4 w-4 mr-1" /> Editar
        </Button>
      ),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-1"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">Control Horario</h1>
        <div className="flex gap-2">
          {!activeTimer ? (
            <Button
              onClick={handleStartTimer}
              className="bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center gap-2"
              disabled={isLoading}
            >
              <PlayCircle className="h-5 w-5" /> Iniciar Jornada
            </Button>
          ) : (
            <Button
              onClick={handleStopTimer}
              className="bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center gap-2"
              disabled={isLoading}
            >
              <StopCircle className="h-5 w-5" /> Finalizar Jornada
            </Button>
          )}
          {isAdmin && (
            <Button
              onClick={openModalForCreate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2"
            >
              <PlusCircle className="h-5 w-5" /> Añadir de forma manual
            </Button>
          )}
        </div>
      </div>

      {!activeTimer && (
        <motion.div
          layout
          className="p-4 border rounded-lg bg-card shadow space-y-3 mb-4"
        >
          <h3 className="text-lg font-medium text-foreground">
            Fichaje Rápido
          </h3>
          <div>
            <Label htmlFor="quick-start-project-id">Proyecto Activo</Label>
            {/* CORREGIDO: El valor y la clave ahora usan uuid_id */}
            <Select
              name="project_id"
              value={isOtherProject ? "OTROS" : activeProjectId || ""}
              onValueChange={handleActiveProjectChange}
            >
              <SelectTrigger
                id="quick-start-project-id"
                className="mt-1 bg-background border-input"
              >
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.uuid_id} value={p.uuid_id}>
                    {p.nombre}
                  </SelectItem>
                ))}
                <SelectItem value="OTROS">OTROS (No listado)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isOtherProject && (
            <div>
              <Label htmlFor="quick-start-other-details">
                Detalles del Proyecto "OTROS"
              </Label>
              <Input
                id="quick-start-other-details"
                value={otherProjectDetails}
                onChange={(e) => setOtherProjectDetails(e.target.value)}
                className="mt-1 bg-background border-input"
              />
            </div>
          )}
          <div>
            <Label htmlFor="quick-start-notes">Notas (Opcional)</Label>
            <Textarea
              id="quick-start-notes"
              value={quickStartNotes}
              onChange={(e) => setQuickStartNotes(e.target.value)}
              className="mt-1 bg-background border-input"
            />
          </div>
        </motion.div>
      )}

      <Dialog
        open={isModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) resetModalFormAndClose();
          else setIsModalOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary text-2xl">
              {currentEntry ? "Editar Fichaje" : "Añadir Fichaje Manual"}
            </DialogTitle>
            <DialogDescription>
              {currentEntry
                ? "Modifica los detalles del fichaje."
                : "Completa para añadir un nuevo fichaje."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleModalSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="project_id">Proyecto</Label>
              {/* CORREGIDO: El valor y la clave del modal también usan uuid_id */}
              <Select
                name="project_id"
                value={
                  modalFormData.is_other_project
                    ? "OTROS"
                    : modalFormData.project_id || ""
                }
                onValueChange={(value) =>
                  handleModalSelectChange("project_id", value)
                }
              >
                <SelectTrigger
                  id="project_id"
                  className="mt-1 bg-background border-input"
                >
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.uuid_id} value={p.uuid_id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                  <SelectItem value="OTROS">OTROS (No listado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {modalFormData.is_other_project && (
              <div>
                <Label htmlFor="other_project_details">
                  Detalles del Proyecto "OTROS"
                </Label>
                <Input
                  id="other_project_details"
                  name="other_project_details"
                  value={modalFormData.other_project_details}
                  onChange={handleModalInputChange}
                  className="mt-1 bg-background border-input"
                />
              </div>
            )}
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={modalFormData.date}
                onChange={handleModalInputChange}
                required
                className="mt-1 bg-background border-input"
              />
            </div>
            <div>
              <Label htmlFor="start_time">Hora de Inicio</Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                value={modalFormData.start_time}
                onChange={handleModalInputChange}
                required
                className="mt-1 bg-background border-input"
              />
            </div>
            <div>
              <Label htmlFor="end_time">Hora de Fin (opcional)</Label>
              <Input
                id="end_time"
                name="end_time"
                type="datetime-local"
                value={modalFormData.end_time}
                onChange={handleModalInputChange}
                className="mt-1 bg-background border-input"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                value={modalFormData.notes}
                onChange={handleModalInputChange}
                className="mt-1 bg-background border-input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetModalFormAndClose}
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
                {currentEntry ? "Guardar Cambios" : "Crear Fichaje"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading && timeEntries.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={timeEntries}
          searchableColumns={[
            { accessor: "project_name", header: "Proyecto" },
            { accessor: "notes", header: "Notas" },
          ]}
          filterableColumns={
            isAdmin ? [{ accessor: "usuarios.nombre", header: "Usuario" }] : []
          }
        />
      )}
    </motion.div>
  );
};

export default TimeTrackingPage;
