import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Loader2,
  Briefcase,
  Car,
  PlusCircle,
  XCircle,
  Clock,
  User,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PlanningGrid } from "@/components/planning/PlanningGrid";
import { supabase } from "@/lib/supabaseClient";
import { ROLES } from "@/contexts/UserContext";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProjectDetailView from "@/components/projects/ProjectDetailView";
import {
  startOfWeek,
  subWeeks,
  format,
  eachDayOfInterval,
  isToday,
  startOfMonth,
  endOfMonth,
  subMonths,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { exportToExcel } from "@/lib/exportPlanningToExcel";

const TASK_COLORS = [
  { class: "bg-blue-400/70 border border-blue-600/30", hex: "FF60A5FA" },
  { class: "bg-green-400/70 border border-green-600/30", hex: "FF4ADE80" },
  { class: "bg-red-400/70 border border-red-600/30", hex: "FFF87171" },
  { class: "bg-purple-400/70 border border-purple-600/30", hex: "FFC084FC" },
  { class: "bg-yellow-400/70 border border-yellow-600/30", hex: "FFFBBF24" },
  { class: "bg-indigo-400/70 border border-indigo-600/30", hex: "FF818CF8" },
  { class: "bg-pink-400/70 border border-pink-600/30", hex: "FFF472B6" },
];

const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = String(h).padStart(2, "0");
      const minute = String(m).padStart(2, "0");
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

const RANGE_OPTIONS = [
  { value: "current_week", label: "Semana Actual" },
  { value: "last_week", label: "Semana Pasada" },
  { value: "2_weeks_ago", label: "Hace 2 Semanas" },
  { value: "3_weeks_ago", label: "Hace 3 Semanas" },
  { value: "current_month", label: "Mes Actual" },
  { value: "last_month", label: "Mes Pasado" },
];

const PlanningPage = () => {
  const { toast } = useToast();

  const [assignments, setAssignments] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projectColors, setProjectColors] = useState({});
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [currentProjectForVehicle, setCurrentProjectForVehicle] =
    useState(null);
  const [selectedVehicleToAdd, setSelectedVehicleToAdd] = useState("");
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedProjectForDetails, setSelectedProjectForDetails] =
    useState(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [selectedRange, setSelectedRange] = useState("current_week");
  const [startDate, setStartDate] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [endDate, setEndDate] = useState(
    endOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [displayDates, setDisplayDates] = useState([]);
  const [selectedEmployeeForMonthView, setSelectedEmployeeForMonthView] =
    useState(null);

  useEffect(() => {
    const now = new Date();
    let start, end;
    switch (selectedRange) {
      case "current_week":
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "last_week":
        start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case "2_weeks_ago":
        start = startOfWeek(subWeeks(now, 2), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(now, 2), { weekStartsOn: 1 });
        break;
      case "3_weeks_ago":
        start = startOfWeek(subWeeks(now, 3), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(now, 3), { weekStartsOn: 1 });
        break;
      case "current_month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "last_month":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      default:
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
    }
    setStartDate(start);
    setEndDate(end);
    if (!selectedRange.includes("month")) {
      setSelectedEmployeeForMonthView(null);
    }
  }, [selectedRange]);

  useEffect(() => {
    if (!startDate || !endDate) return;
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const formattedDates = days.map((date) => ({
      fullDate: date,
      dayName: format(date, "EEE", { locale: es }),
      dayOfMonth: format(date, "d", { locale: es }),
      monthName: format(date, "MMM", { locale: es }),
      isToday: isToday(date),
    }));
    setDisplayDates(formattedDates);
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesResponse, projectsResponse, usersResponse] =
          await Promise.all([
            supabase.from("vehiculos").select("*").order("numero_interno"),
            supabase
              .from("proyectos")
              .select("*, vehiculos_asignados, default_start_time")
              .eq("estado", "En Proceso"),
            supabase
              .from("usuarios")
              .select("id, nombre, rol")
              .eq("rol", ROLES.WORKER),
          ]);

        if (vehiclesResponse.error) throw vehiclesResponse.error;
        if (projectsResponse.error) throw projectsResponse.error;
        if (usersResponse.error) throw usersResponse.error;

        setVehicles(vehiclesResponse.data || []);
        const formattedProjects = (projectsResponse.data || []).map(
          (project) => ({
            ...project,
            default_start_time:
              typeof project.default_start_time === "string" &&
              project.default_start_time.length >= 5
                ? project.default_start_time.substring(0, 5)
                : null,
          })
        );
        setProjects(formattedProjects);
        setEmployees(usersResponse.data || []);

        const initialProjectColors = {};
        (projectsResponse.data || []).forEach((project, index) => {
          initialProjectColors[project.id] =
            TASK_COLORS[index % TASK_COLORS.length];
        });
        setProjectColors(initialProjectColors);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos iniciales",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [toast]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!startDate || !endDate) return;
      setLoadingAssignments(true);
      try {
        const startISO = format(startDate, "yyyy-MM-dd");
        const endISO = format(endDate, "yyyy-MM-dd");
        const { data, error } = await supabase
          .from("planificaciones")
          .select(
            `id, usuario_id, proyecto_id, assignment_date, notas, metadata, proyectos ( nombre, vehiculos_asignados, default_start_time )`
          )
          .gte("assignment_date", startISO)
          .lte("assignment_date", endISO)
          .order("assignment_date", { ascending: true });

        if (error) throw error;

        const loadedAssignments = {};
        (data || []).forEach((dbAssignment) => {
          const projectTitle =
            dbAssignment.proyectos?.nombre || "Obra Desconocida";
          const projectVehicleIds =
            dbAssignment.proyectos?.vehiculos_asignados || [];
          const vehicleDisplays = projectVehicleIds
            .map((vId) => {
              const vehicle = vehicles.find((v) => v.id === vId);
              return vehicle
                ? `${vehicle.numero_interno} - ${vehicle.patente}`
                : null;
            })
            .filter(Boolean);

          const colorInfo =
            projectColors[dbAssignment.proyecto_id] || TASK_COLORS[0];
          const cellKey = `${dbAssignment.usuario_id}-${dbAssignment.assignment_date}`;

          if (!loadedAssignments[cellKey]) loadedAssignments[cellKey] = [];

          loadedAssignments[cellKey].push({
            instanceId: dbAssignment.id,
            projectId: dbAssignment.proyecto_id,
            title: projectTitle,
            color: colorInfo.class,
            projectVehicles: vehicleDisplays,
            projectStartTime: dbAssignment.proyectos?.default_start_time,
            assignedDate: dbAssignment.assignment_date,
            notes: dbAssignment.notas,
          });
        });
        setAssignments(loadedAssignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las asignaciones.",
          variant: "destructive",
        });
        setAssignments({});
      } finally {
        setLoadingAssignments(false);
      }
    };

    if (employees.length > 0) {
      fetchAssignments();
    }
  }, [startDate, endDate, employees, projects, projectColors, vehicles, toast]);

  const onAssignTask = useCallback(
    async (projectId, employeeId, dayObjectOrISOString) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const fullDate =
        typeof dayObjectOrISOString === "object" &&
        dayObjectOrISOString.fullDate
          ? dayObjectOrISOString.fullDate
          : new Date(dayObjectOrISOString);
      const dayISOString = format(fullDate, "yyyy-MM-dd");
      const colorInfo = projectColors[projectId] || TASK_COLORS[0];
      const newDbAssignment = {
        usuario_id: employeeId,
        proyecto_id: projectId,
        assignment_date: dayISOString,
        notas: null,
        metadata: { color: colorInfo.class },
      };
      try {
        const { data, error } = await supabase
          .from("planificaciones")
          .insert([newDbAssignment])
          .select("*")
          .single();
        if (error) throw error;

        const assignedProject = projects.find((p) => p.id === data.proyecto_id);
        const projectVehicleIds = assignedProject?.vehiculos_asignados || [];
        const vehicleDisplays = projectVehicleIds
          .map((vId) => {
            const vehicle = vehicles.find((v) => v.id === vId);
            return vehicle
              ? `${vehicle.numero_interno} - ${vehicle.patente}`
              : null;
          })
          .filter(Boolean);

        const cellKey = `${employeeId}-${dayISOString}`;
        setAssignments((prev) => ({
          ...prev,
          [cellKey]: [
            ...(prev[cellKey] || []),
            {
              instanceId: data.id,
              projectId: data.proyecto_id,
              title: project.nombre,
              color: colorInfo.class,
              projectVehicles: vehicleDisplays,
              projectStartTime: assignedProject?.default_start_time,
              assignedDate: data.assignment_date,
              notes: data.notas,
            },
          ],
        }));
        toast({
          title: "Tarea asignada",
          description: `"${project.nombre}" asignada a ${
            employees.find((e) => e.id === employeeId)?.nombre ||
            "Empleado Desconocido"
          } el ${format(fullDate, "EEE d MMM", { locale: es })}.`,
          duration: 3000,
        });
      } catch (error) {
        console.error("Error saving assignment to DB:", error);
        toast({
          title: "Error al asignar",
          description: "No se pudo guardar la asignación.",
          variant: "destructive",
          duration: 5000,
        });
      }
    },
    [projects, employees, projectColors, vehicles, toast]
  );

  const onRemoveTask = useCallback(
    async (employeeId, dayISOString, instanceIdToRemove) => {
      try {
        const { error } = await supabase
          .from("planificaciones")
          .delete()
          .eq("id", instanceIdToRemove);
        if (error) throw error;
        setAssignments((prevAssignments) => {
          const cellKey = `${employeeId}-${dayISOString}`;
          const newAssignmentsForCell = (prevAssignments[cellKey] || []).filter(
            (assignment) => assignment.instanceId !== instanceIdToRemove
          );
          const newAssignments = { ...prevAssignments };
          if (newAssignmentsForCell.length > 0) {
            newAssignments[cellKey] = newAssignmentsForCell;
          } else {
            delete newAssignments[cellKey];
          }
          return newAssignments;
        });
        toast({
          title: "Tarea eliminada",
          description: "La tarea ha sido eliminada de la planificación.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error deleting assignment from DB:", error);
        toast({
          title: "Error al eliminar",
          description: "No se pudo eliminar la asignación.",
          variant: "destructive",
          duration: 5000,
        });
      }
    },
    [toast]
  );

  const onShowTaskDetails = useCallback(
    (projectId) => {
      const projectToShow = projects.find((p) => p.id === projectId);
      if (projectToShow) {
        setSelectedProjectForDetails(projectToShow);
        setShowProjectDetailsModal(true);
      } else {
        toast({
          title: "Información",
          description:
            "Los detalles solo están disponibles para obras activas.",
          variant: "default",
        });
      }
    },
    [projects, toast]
  );

  const openAddVehicleModal = (projectId) => {
    setCurrentProjectForVehicle(projectId);
    setSelectedVehicleToAdd("");
    setShowAddVehicleModal(true);
  };

  const handleAddVehicleToProject = useCallback(async () => {
    if (currentProjectForVehicle && selectedVehicleToAdd) {
      const currentProject = projects.find(
        (p) => p.id === currentProjectForVehicle
      );
      const updatedVehicles = Array.from(
        new Set([
          ...(currentProject?.vehiculos_asignados || []),
          selectedVehicleToAdd,
        ])
      );
      try {
        const { data, error } = await supabase
          .from("proyectos")
          .update({ vehiculos_asignados: updatedVehicles })
          .eq("id", currentProjectForVehicle)
          .select("id, vehiculos_asignados")
          .single();
        if (error) throw error;
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.id === data.id
              ? { ...p, vehiculos_asignados: data.vehiculos_asignados }
              : p
          )
        );
        toast({
          title: "Vehículo asignado a obra",
          description: "Vehículo añadido a la lista de la obra.",
          duration: 3000,
        });
        setShowAddVehicleModal(false);
        setCurrentProjectForVehicle(null);
        setSelectedVehicleToAdd("");
      } catch (error) {
        console.error("Error adding vehicle to project in DB:", error);
        toast({
          title: "Error",
          description: "No se pudo añadir el vehículo a la obra.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Por favor, selecciona un vehículo.",
        variant: "destructive",
      });
    }
  }, [currentProjectForVehicle, selectedVehicleToAdd, projects, toast]);

  const removeVehicleFromProject = useCallback(
    async (projectId, vehicleIdToRemove) => {
      const currentProject = projects.find((p) => p.id === projectId);
      const updatedVehicles = (
        currentProject?.vehiculos_asignados || []
      ).filter((id) => id !== vehicleIdToRemove);
      try {
        const { data, error } = await supabase
          .from("proyectos")
          .update({ vehiculos_asignados: updatedVehicles })
          .eq("id", projectId)
          .select("id, vehiculos_asignados")
          .single();
        if (error) throw error;
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.id === data.id
              ? { ...p, vehiculos_asignados: data.vehiculos_asignados }
              : p
          )
        );
        toast({
          title: "Vehículo desasignado de obra",
          description: "Vehículo eliminado de la lista de la obra.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error removing vehicle from project in DB:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el vehículo de la obra.",
          variant: "destructive",
          duration: 5000,
        });
      }
    },
    [projects, toast]
  );

  const getAssignedVehiclesInProjects = useCallback(() => {
    const assignedIds = new Set();
    projects.forEach((project) => {
      if (project.vehiculos_asignados) {
        project.vehiculos_asignados.forEach((vId) => assignedIds.add(vId));
      }
    });
    return assignedIds;
  }, [projects]);

  const assignedVehicleIds = getAssignedVehiclesInProjects();

  const handleStartTimeChange = useCallback(
    async (projectId, time) => {
      try {
        const { data, error } = await supabase
          .from("proyectos")
          .update({ default_start_time: time })
          .eq("id", projectId)
          .select("id, default_start_time")
          .single();
        if (error) throw error;
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.id === data.id
              ? { ...p, default_start_time: data.default_start_time }
              : p
          )
        );
        toast({
          title: "Hora de inicio actualizada",
          description:
            "La hora de inicio por defecto de la obra ha sido guardada.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error updating project start time in DB:", error);
        toast({
          title: "Error",
          description: "No se pudo guardar la hora de inicio de la obra.",
          variant: "destructive",
          duration: 5000,
        });
      }
    },
    [toast]
  );

  const isMonthView = selectedRange.includes("month");

  const employeesToDisplay = useMemo(() => {
    if (isMonthView) {
      if (selectedEmployeeForMonthView) {
        const selected = employees.find(
          (e) => e.id === selectedEmployeeForMonthView
        );
        return selected ? [selected] : [];
      } else {
        return [];
      }
    }
    return employees;
  }, [isMonthView, selectedEmployeeForMonthView, employees]);

  const selectedEmployeeName = useMemo(() => {
    if (isMonthView && selectedEmployeeForMonthView) {
      const emp = employees.find((e) => e.id === selectedEmployeeForMonthView);
      return emp ? `${emp.nombre} ${emp.apellido}` : null;
    }
    return null;
  }, [isMonthView, selectedEmployeeForMonthView, employees]);

  const calendarWeeks = useMemo(() => {
    if (!isMonthView || displayDates.length === 0) return [];
    const firstDayOfWeek = (displayDates[0].fullDate.getDay() + 6) % 7;
    const leadingEmptyCells = Array(firstDayOfWeek).fill(null);
    const allCells = [...leadingEmptyCells, ...displayDates];
    const weeks = [];
    for (let i = 0; i < allCells.length; i += 7) {
      weeks.push(allCells.slice(i, i + 7));
    }
    const lastWeek = weeks[weeks.length - 1];
    if (lastWeek && lastWeek.length < 7) {
      const trailingEmptyCells = Array(7 - lastWeek.length).fill(null);
      weeks[weeks.length - 1] = [...lastWeek, ...trailingEmptyCells];
    }
    return weeks;
  }, [displayDates, isMonthView]);

  const handleExport = () => {
    // Llamamos a la función principal, que ahora está en `exceljs`
    exportToExcel({
      isMonthView,
      employees: employeesToDisplay,
      displayDates,
      assignments,
      calendarWeeks,
      projectColors,
      projects,
      vehicles,
      startDate,
    });
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Planificación</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar a Excel
          </Button>
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar Rango" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isMonthView && (
            <Select
              value={selectedEmployeeForMonthView || ""}
              onValueChange={setSelectedEmployeeForMonthView}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar Empleado..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="text-md font-semibold text-primary mx-2 text-center sm:text-left">
            {startDate &&
              endDate &&
              `${format(startDate, "d MMM", { locale: es })} - ${format(
                endDate,
                "d MMM",
                { locale: es }
              )}`}
          </span>
          {selectedEmployeeName && (
            <div className="flex items-center gap-2 text-sm font-semibold bg-muted text-muted-foreground p-2 rounded-md">
              <User className="h-4 w-4" />
              <span>{selectedEmployeeName}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="w-full">
          {loadingAssignments ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground text-lg">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
          ) : employees.length === 0 && !isMonthView ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground text-lg flex-col gap-4">
              <p>No hay empleados para planificar.</p>
              <p className="text-sm">
                Asegúrate de que haya usuarios con rol 'TECNICO'.
              </p>
            </div>
          ) : (
            <PlanningGrid
              employees={employeesToDisplay}
              displayDates={displayDates}
              assignments={assignments}
              onAssignTask={onAssignTask}
              onRemoveTask={onRemoveTask}
              onShowTaskDetails={onShowTaskDetails}
              projects={projects}
              isMonthView={isMonthView}
            />
          )}
        </div>
        {!isMonthView && (
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Obras Activas y Gestión de Vehículos / Horas
            </h2>
            {projects.length > 0 ? (
              <div className="grid gap-4">
                {projects.map((project) => {
                  const assignedVehicleIdsToProject =
                    project.vehiculos_asignados || [];
                  return (
                    <div
                      key={project.id}
                      onClick={() => onShowTaskDetails(project.id)}
                      className="grid grid-cols-[1fr,auto] md:grid-cols-[2fr_1fr_2fr] gap-4 items-center p-4 bg-muted/50 rounded-lg border cursor-pointer hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded border ${
                            projectColors[project.id]?.class ||
                            "bg-primary/10 border-primary/20"
                          }`}
                        >
                          {project.nombre}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={project.default_start_time || ""}
                          onValueChange={(value) =>
                            handleStartTimeChange(project.id, value)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Hora Ini." />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 overflow-y-auto">
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {assignedVehicleIdsToProject.map((vId) => {
                          const display = vehicles.find((v) => v.id === vId);
                          return display ? (
                            <span
                              key={vId}
                              className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 shadow-sm border border-blue-200"
                            >
                              <Car className="h-4 w-4 mr-1.5 text-blue-600" />
                              {display.numero_interno} - {display.patente}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeVehicleFromProject(project.id, vId);
                                }}
                                className="ml-2 -mr-1 h-5 w-5 rounded-full bg-blue-200 text-blue-800 hover:bg-blue-300 flex items-center justify-center transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </span>
                          ) : null;
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1.5 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddVehicleModal(project.id);
                          }}
                        >
                          <PlusCircle className="h-4 w-4" />
                          Asignar Vehículo
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-5 border-dashed border-2 rounded-lg bg-muted/30">
                <p>No hay proyectos Activos para asignar.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <AlertDialog
        open={showAddVehicleModal}
        onOpenChange={setShowAddVehicleModal}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-xl font-bold text-primary">
              Añadir Vehículo a Obra
            </AlertDialogTitle>
            <p className="text-sm text-muted-foreground">
              Selecciona un vehículo para añadir a la obra "
              {projects.find((p) => p.id === currentProjectForVehicle)
                ?.nombre || ""}
              ".
            </p>
          </AlertDialogHeader>
          <div className="grid gap-3 max-h-[300px] overflow-auto p-2 border rounded-md bg-accent/20">
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => {
                const isAssignedToCurrentProject = projects
                  .find((p) => p.id === currentProjectForVehicle)
                  ?.vehiculos_asignados?.includes(vehicle.id);
                const isAssignedToAnotherProject =
                  !isAssignedToCurrentProject &&
                  assignedVehicleIds.has(vehicle.id);
                if (isAssignedToAnotherProject) {
                  return (
                    <div
                      key={vehicle.id}
                      className="flex items-center gap-2 p-3 rounded-md border border-dashed border-gray-300 text-left text-sm font-medium text-gray-500 bg-gray-50 cursor-not-allowed opacity-70"
                    >
                      <Car className="h-4 w-4 text-gray-400" />
                      {vehicle.numero_interno} - {vehicle.patente}{" "}
                      <span className="ml-auto text-xs">
                        (Asignado a otra obra)
                      </span>
                    </div>
                  );
                } else if (!isAssignedToCurrentProject) {
                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleToAdd(vehicle.id)}
                      className={`flex items-center gap-2 p-3 rounded-md border text-left text-sm font-medium shadow-sm transition-colors duration-200 ${
                        selectedVehicleToAdd === vehicle.id
                          ? "border-blue-500 bg-blue-100 text-blue-800"
                          : "border-border bg-background hover:bg-muted/70"
                      }`}
                    >
                      <Car className="h-4 w-4 text-muted-foreground" />
                      {vehicle.numero_interno} - {vehicle.patente}
                    </button>
                  );
                }
                return null;
              })
            ) : (
              <p className="text-center text-muted-foreground p-4">
                No hay vehículos disponibles para añadir.
              </p>
            )}
          </div>
          <AlertDialogFooter className="pt-4 flex justify-between">
            <AlertDialogCancel onClick={() => setShowAddVehicleModal(false)}>
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={handleAddVehicleToProject}
              disabled={!selectedVehicleToAdd}
              className="min-w-[100px]"
            >
              Añadir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ProjectDetailView
        project={selectedProjectForDetails}
        isOpen={showProjectDetailsModal}
        onOpenChange={setShowProjectDetailsModal}
      />
    </div>
  );
};

export default PlanningPage;
