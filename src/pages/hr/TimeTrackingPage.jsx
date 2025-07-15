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
  FileDown,
  Clock
} from "lucide-react";
import { exportTimeEntriesToExcel } from "@/lib/exportTimersToExcel";

const TimeTrackingPage = () => {
  const { user, activeProjectId, setCurrentActiveProject, isOtherProject } = useUser();
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  const [filteredTimeEntries, setFilteredTimeEntries] = useState([]);
  const [quickStartNotes, setQuickStartNotes] = useState("");
  const [otherProjectDetails, setOtherProjectDetails] = useState("");
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

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
              ? `OTRO: ${entry.other_project_details}`
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
      .select("id, nombre, uuid_id")
      .order("nombre")
      .eq('estado', 'En Proceso')
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

  useEffect(() => {
    let intervalId;
    if (activeTimer) {
      const runningEntry = timeEntries.find((e) => e.id === activeTimer);

      if (runningEntry) {
        const startTime = new Date(runningEntry.start_time);
        intervalId = setInterval(() => {
          const now = new Date();
          const elapsed = now - startTime;
          setElapsedTime(formatDuration(elapsed));
        }, 1000);
      }
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTimer, timeEntries]);

  const handleActiveProjectChange = (projectId) => {
      setCurrentActiveProject(projectId);
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        toast({
          title: "Proyecto Activo Cambiado",
          description: `Ahora estás trabajando en "${project.nombre}".`,
          variant: "success",
        });
      } else {
        toast({
          title: "Proyecto Activo Cambiado",
          description: `Seleccionaste "OTRO" como proyecto, por favor no olvides describir de que se trata.`,
          variant: "info",
        });
      }
  };
  const toLocalISOString = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const tzoffset = new Date().getTimezoneOffset() * 60000;
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
        variant: "destructive",
      });
      return;
    }
    if (isOtherProject && !otherProjectDetails.trim()) {
      toast({
        title: "Acción Requerida",
        description: "Añade los detalles del proyecto 'OTRO'.",
        variant: "destructive",
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
        description: "No hay ningún fichaje activo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // --- PASO 1: Obtenemos el fichaje activo para saber su hora de inicio ---
      const { data: activeEntry, error: fetchError } = await supabase
        .from("time_tracking")
        .select("start_time, project_id")
        .eq("id", activeTimer)
        .single();

      if (fetchError || !activeEntry) {
        throw new Error(
          "No se pudo encontrar el fichaje activo para detenerlo."
        );
      }

      // --- PASO 2: Calculamos la duración ---
      const startTime = new Date(activeEntry.start_time);
      const endTime = new Date();

      const durationInMilliseconds = endTime - startTime;
      const workedHours = durationInMilliseconds / (1000 * 60 * 60);

      const { error: updateError } = await supabase
        .from("time_tracking")
        .update({
          end_time: endTime.toISOString(),
          work_time: workedHours,
        })
        .eq("id", activeTimer);

      if (updateError) {
        throw new Error(
          `No se pudo actualizar el fichaje: ${updateError.message}`
        );
      }

      toast({
        title: "Fichaje Detenido",
        description: `Tiempo trabajado: ${workedHours.toFixed(2)} horas.`,
        variant: "success",
      });

      if (activeEntry.project_id) {
        const { data: projectData, error: projectFetchError } = await supabase
          .from("proyectos")
          .select("horas, nombre")
          .eq("uuid_id", activeEntry.project_id)
          .single();

        if (projectFetchError) {
          toast({
            title: "Advertencia",
            description:
              "No se pudo encontrar el proyecto para actualizar sus horas.",
            variant: "destructive",
          });
        } else {
          const currentHours = projectData.horas;
          const newHours = currentHours + workedHours;
          const { error: updateProjectError } = await supabase
            .from("proyectos")
            .update({ horas: newHours })
            .eq("uuid_id", activeEntry.project_id);

          if (updateProjectError) {
            toast({
              title: "Advertencia",
              description: "No se pudieron actualizar las horas del proyecto.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Horas de Proyecto Actualizadas",
              description: `Se sumaron ${workedHours.toFixed(
                2
              )} horas del proyecto "${projectData.nombre}".`,
              variant: "success",
            });
          }
        }
      }
      setActiveTimer(null);
      fetchTimeEntries();
    } catch (error) {
      toast({
        title: "Ocurrió un Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalSelectChange = (name, value) => {
    setModalFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "project_id" && value === "OTRO") {
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
      work_time: "",
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
      project_id: entry.project_id || (entry.is_other_project ? "OTRO" : ""),
      date: entry.date,
      start_time: entry.start_time ? toLocalISOString(entry.start_time) : "",
      end_time: entry.end_time ? toLocalISOString(entry.end_time) : "",
      work_time: entry.work_time ? toLocalISOString(entry.work_time) : "",
      is_other_project: entry.is_other_project,
      other_project_details: entry.other_project_details || "",
      notes: entry.notes || "",
    });
    setIsModalOpen(true);
  };

  const formatDuration = (milliseconds) => {
  if (milliseconds < 0) milliseconds = 0;
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

  const calculateDurationInHours = (startTime, endTime) => {
    if (!startTime || !endTime) {
      return 0;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInMilliseconds = end - start;
    return Math.max(0, durationInMilliseconds / (1000 * 60 * 60));
  };

  const updateProjectHours = async (projectId, hoursToAdjust) => {
    if (!projectId || hoursToAdjust === 0) {
      return;
    }

    try {
      const { data: project, error: fetchError } = await supabase
        .from("proyectos")
        .select("horas, nombre")
        .eq("id", projectId)
        .single();

      if (fetchError)
        throw new Error(
          `No se pudo obtener el proyecto para ajustar horas: ${fetchError.message}`
        );

      const newHours = project.horas + hoursToAdjust;

      const { error: updateError } = await supabase
        .from("proyectos")
        .update({ horas: newHours })
        .eq("id", projectId);

      if (updateError)
        throw new Error(
          `No se pudo actualizar el proyecto: ${updateError.message}`
        );

      console.log(
        `Horas del proyecto "${project.nombre}" actualizadas correctamente.`
      );
    } catch (error) {
      toast({
        title: "Error al actualizar horas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // --- LÓGICA PARA EDITAR UN FICHAJE EXISTENTE ---
      if (currentEntry) {
        const oldDuration = calculateDurationInHours(
          currentEntry.start_time,
          currentEntry.end_time
        );
        const oldProjectId = currentEntry.project_id;
        const dataToSave = {
          project_id: modalFormData.is_other_project
            ? null
            : modalFormData.project_id,
          date: modalFormData.date,
          start_time: new Date(modalFormData.start_time).toISOString(),
          end_time: modalFormData.end_time
            ? new Date(modalFormData.end_time).toISOString()
            : null,
          work_time: calculateDurationInHours(
            modalFormData.start_time,
            modalFormData.end_time
          ),
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

        if (error) throw error;

        const newDuration = calculateDurationInHours(
          updatedEntry.start_time,
          updatedEntry.end_time
        );
        const newProjectId = updatedEntry.project_id;

        if (oldProjectId === newProjectId) {
          const durationDelta = newDuration - oldDuration;
          if (newProjectId) {
            await updateProjectHours(newProjectId, durationDelta);
          }
        } else {
          if (oldProjectId) {
            await updateProjectHours(oldProjectId, -oldDuration);
          }
          if (newProjectId) {
            await updateProjectHours(newProjectId, newDuration);
          }
        }

        toast({ title: "Fichaje Actualizado", variant: "success" });
      } else {
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
          work_time: calculateDurationInHours(
            modalFormData.start_time,
            modalFormData.end_time
          ),
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
        const duration = calculateDurationInHours(
          newEntry.start_time,
          newEntry.end_time
        );
        if (duration > 0 && newEntry.project_id) {
          await updateProjectHours(newEntry.project_id, duration);
        }

        toast({ title: "Fichaje Creado", variant: "success" });
      }
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
    {
      header: "Tiempo Trabajado",
      accessor: "work_time",
      cell: ({ row }) => {
        if (row.end_time) {
          const hours = row.work_time;
          if (typeof hours === "number") {
            return `${hours.toFixed(2)} hs`;
          }
          return "N/A";
        }
        return "En curso";
      },
      sortable: true,
    },
    { header: "Notas", accessor: "notes" },
  ];

  if (isAdmin) {
    columns.unshift({
      header: "Usuario",
      accessor: "autor.nombre",
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

  const handleExportToExcel = async () => {
    setIsLoading(true);
    try {
      const buffer = await exportTimeEntriesToExcel(filteredTimeEntries);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `control_horario_${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast({
        title: "Exportación Exitosa",
        description: "El archivo de control horario ha sido generado.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast({
        title: "Error de Exportación",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="flex items-center gap-4 bg-card border rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 text-lg font-mono text-primary animate-pulse">
                <Clock className="h-5 w-5" />
                <span>{elapsedTime}</span>
              </div>
              <Button
                onClick={handleStopTimer}
                className="bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center gap-2"
                disabled={isLoading}
              >
                <StopCircle className="h-5 w-5" /> Finalizar Jornada
              </Button>
            </div>
          )}
          {isAdmin && (
            <>
              <Button
                onClick={openModalForCreate}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2"
              >
                <PlusCircle className="h-5 w-5" /> Añadir de forma manual
              </Button>
              <Button
                onClick={handleExportToExcel}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <FileDown className="h-5 w-5" /> Exportar a Excel
              </Button>
            </>
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
              value={isOtherProject ? "OTRO" : activeProjectId || 0}
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
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
                <SelectItem value="OTRO">OTRO (No listado)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isOtherProject && (
            <div>
              <Label htmlFor="quick-start-other-details">
                Detalles del Proyecto "OTRO"
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
                    ? "OTRO"
                    : String(modalFormData.project_id || "")
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
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                  <SelectItem value="OTRO">OTRO (No listado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {modalFormData.is_other_project && (
              <div>
                <Label htmlFor="other_project_details">
                  Detalles del Proyecto "OTRO"
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
          onFilteredDataChange={setFilteredTimeEntries}
          searchableColumns={[
            { accessor: "project_name", header: "Proyecto" },
            { accessor: "autor.nombre", header: "Nombre" },
          ]}
          filterableColumns={
            isAdmin
              ? [
                  { accessor: "autor.nombre", header: "Usuario" },
                  { accessor: "project_name", header: "Proyecto" },
                ]
              : [{ accessor: "project_name", header: "Proyecto" }]
          }
        />
      )}
    </motion.div>
  );
};

export default TimeTrackingPage;
