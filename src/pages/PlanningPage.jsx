// src/pages/PlanningPage.jsx
import React, { useState, useCallback, useEffect } from "react";
import {
  CalendarDays,
  Briefcase,
  Users,
  Car,
  PlusCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PlanningGrid } from "@/components/planning/PlanningGrid";
import { supabase } from "@/lib/supabaseClient";
import { ROLES } from "@/contexts/UserContext";
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

import ProjectDetailView from "@/components/projects/ProjectDetailView";

import {
  startOfWeek,
  addWeeks,
  subWeeks,
  format,
  eachDayOfInterval,
  isToday,
  isSameWeek,
} from "date-fns";
import { es } from "date-fns/locale";

const TASK_COLORS = [
  "bg-blue-400/70 border border-blue-600/30",
  "bg-green-400/70 border border-green-600/30",
  "bg-red-400/70 border border-red-600/30",
  "bg-purple-400/70 border border-purple-600/30",
  "bg-yellow-400/70 border border-yellow-600/30",
  "bg-indigo-400/70 border border-indigo-600/30",
  "bg-pink-400/70 border border-pink-600/30",
];

const PlanningPage = () => {
  const { toast } = useToast();

  const [assignments, setAssignments] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [projectVehicleAssignments, setProjectVehicleAssignments] = useState(
    {}
  );
  const [projectColors, setProjectColors] = useState({});

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [currentProjectForVehicle, setCurrentProjectForVehicle] =
    useState(null);
  const [selectedVehicleToAdd, setSelectedVehicleToAdd] = useState("");

  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedProjectForDetails, setSelectedProjectForDetails] =
    useState(null);

  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [weekDates, setWeekDates] = useState([]);

  useEffect(() => {
    const start = currentWeekStart;
    const end = addWeeks(start, 1); // La semana termina 7 días después (domingo)
    const days = eachDayOfInterval({
      start: start,
      end: addWeeks(start, 1) - 1,
    }); // Intervalo de 7 días

    const formattedDates = days.map((date) => ({
      fullDate: date,
      dayName: format(date, "EEE", { locale: es }),
      dayOfMonth: format(date, "d", { locale: es }),
      monthName: format(date, "MMM", { locale: es }),
      isToday: isToday(date),
    }));
    setWeekDates(formattedDates);
  }, [currentWeekStart]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesResponse, projectsResponse, usersResponse] =
          await Promise.all([
            supabase.from("vehiculos").select("*").order("numero_interno"),
            supabase.from("proyectos").select("*").eq("estado", "En Proceso"),
            supabase.from("usuarios").select("*").eq("rol", ROLES.WORKER),
          ]);

        if (vehiclesResponse.error) throw vehiclesResponse.error;
        if (projectsResponse.error) throw projectsResponse.error;
        if (usersResponse.error) throw usersResponse.error;

        setVehicles(vehiclesResponse.data || []);
        setProjects(projectsResponse.data || []);
        setEmployees(usersResponse.data || []);

        const initialProjectColors = {};
        (projectsResponse.data || []).forEach((project, index) => {
          initialProjectColors[project.id] =
            TASK_COLORS[index % TASK_COLORS.length];
        });
        setProjectColors(initialProjectColors);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [toast]);

  const onAssignTask = useCallback(
    (projectId, employeeId, dayObjectOrISOString) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const fullDate =
        typeof dayObjectOrISOString === "object" &&
        dayObjectOrISOString.fullDate
          ? dayObjectOrISOString.fullDate
          : new Date(dayObjectOrISOString);

      const dayISOString = fullDate.toISOString().split("T")[0];

      const cellKey = `${employeeId}-${dayISOString}`;
      const newAssignment = {
        instanceId: `${project.id}-${employeeId}-${dayISOString}-${Date.now()}`,
        projectId: project.id,
        title: project.nombre,
        color: projectColors[project.id],
        vehicleId: null,
        vehicleDisplay: null,
        assignedDate: dayISOString,
      };

      setAssignments((prev) => ({
        ...prev,
        [cellKey]: [newAssignment],
      }));
      toast({
        title: "Tarea asignada",
        description: `"${project.nombre}" asignada a ${
          employees.find((e) => e.id === employeeId)?.nombre ||
          "Empleado Desconocido"
        } el ${format(fullDate, "EEE d MMM", { locale: es })}.`,
      });
    },
    [projects, employees, projectColors, toast]
  );

  // CORRECCIÓN AQUÍ: Usar la función de actualización de estado para setAssignments
  const onRemoveTask = useCallback(
    (employeeId, dayISOString, instanceIdToRemove) => {
      setAssignments((prevAssignments) => {
        // prevAssignments es el estado actual de assignments
        const cellKey = `${employeeId}-${dayISOString}`;
        const newAssignments = { ...prevAssignments }; // Clonar el estado previo
        delete newAssignments[cellKey]; // Eliminar la entrada de la celda
        return newAssignments; // Devolver el nuevo estado
      });
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada de la planificación.",
      });
    },
    [toast]
  ); // `setAssignments` no necesita estar en las dependencias si se usa la forma funcional

  const onUpdateAssignmentVehicle = useCallback(
    (employeeId, day, instanceId, newVehicleId) => {
      setAssignments((prev) => {
        const cellKey = `${employeeId}-${
          day.fullDate.toISOString().split("T")[0]
        }`;
        const updatedAssignments = (prev[cellKey] || []).map((assignment) => {
          if (assignment.instanceId === instanceId) {
            const vehicle = vehicles.find((v) => v.id === newVehicleId);
            return {
              ...assignment,
              vehicleId: newVehicleId,
              vehicleDisplay: vehicle
                ? `${vehicle.numero_interno} - ${vehicle.patente}`
                : null,
            };
          }
          return assignment;
        });
        return {
          ...prev,
          [cellKey]: updatedAssignments,
        };
      });
      toast({
        title: "Vehículo actualizado",
        description: "El vehículo de la tarea ha sido asignado/cambiado.",
      });
    },
    [vehicles, toast]
  );

  const onShowTaskDetails = useCallback(
    (projectId) => {
      const projectToShow = projects.find((p) => p.id === projectId);
      if (projectToShow) {
        setSelectedProjectForDetails(projectToShow);
        setShowProjectDetailsModal(true);
      } else {
        toast({
          title: "Error",
          description: "No se encontró la obra para mostrar detalles.",
          variant: "destructive",
        });
      }
    },
    [projects, toast]
  );

  const onCopyTask = useCallback(
    (taskToCopy, sourceEmployeeId, sourceDay) => {
      toast({
        title: "Copiar Tarea",
        description: `Copiando la tarea "${taskToCopy.title}". (Funcionalidad de pegar no implementada)`,
      });
    },
    [toast]
  );

  const openAddVehicleModal = (projectId) => {
    setCurrentProjectForVehicle(projectId);
    setSelectedVehicleToAdd("");
    setShowAddVehicleModal(true);
  };

  const handleAddVehicleToProject = () => {
    if (currentProjectForVehicle && selectedVehicleToAdd) {
      setProjectVehicleAssignments((prev) => ({
        ...prev,
        [currentProjectForVehicle]: Array.from(
          new Set([
            ...(prev[currentProjectForVehicle] || []),
            selectedVehicleToAdd,
          ])
        ),
      }));
      toast({
        title: "Vehículo asignado a obra",
        description: "Vehículo añadido a la lista de la obra.",
      });
      setShowAddVehicleModal(false);
      setCurrentProjectForVehicle(null);
      setSelectedVehicleToAdd("");
    } else {
      toast({
        title: "Error",
        description: "Por favor, selecciona un vehículo.",
        variant: "destructive",
      });
    }
  };

  const removeVehicleFromProject = useCallback(
    (projectId, vehicleId) => {
      setProjectVehicleAssignments((prev) => {
        const updatedVehicles = (prev[projectId] || []).filter(
          (id) => id !== vehicleId
        );
        return {
          ...prev,
          [projectId]: updatedVehicles.length > 0 ? updatedVehicles : undefined,
        };
      });
      toast({
        title: "Vehículo desasignado de obra",
        description: "Vehículo eliminado de la lista de la obra.",
      });
    },
    [toast]
  );

  const getAssignedVehiclesInProjects = useCallback(() => {
    const assignedIds = new Set();
    for (const projectId in projectVehicleAssignments) {
      if (projectVehicleAssignments[projectId]) {
        projectVehicleAssignments[projectId].forEach((vehicleId) =>
          assignedIds.add(vehicleId)
        );
      }
    }
    return assignedIds;
  }, [projectVehicleAssignments]);

  const assignedVehicleIds = getAssignedVehiclesInProjects();

  const goToPreviousWeek = useCallback(() => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  }, [currentWeekStart]);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  }, [currentWeekStart]);

  const goToCurrentWeek = useCallback(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }, []);

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Planificación Semanal
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={goToCurrentWeek}
            disabled={isSameWeek(currentWeekStart, new Date(), {
              weekStartsOn: 1,
            })}
          >
            Hoy
          </Button>
          <span className="text-lg font-semibold text-primary mx-2">
            {format(currentWeekStart, "d MMM", { locale: es })} -{" "}
            {format(addWeeks(currentWeekStart, 1) - 1, "d MMM", { locale: es })}
          </span>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="w-full">
          <PlanningGrid
            employees={employees}
            weekDates={weekDates}
            assignments={assignments}
            onAssignTask={onAssignTask}
            onRemoveTask={onRemoveTask}
            onShowTaskDetails={onShowTaskDetails}
            projects={projects}
            vehicles={vehicles}
          />
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Obras Activas y Gestión de Vehículos
          </h2>
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onShowTaskDetails(project.id)}
                className="grid grid-cols-[1fr,auto] gap-4 items-center p-4 bg-muted/50 rounded-lg border cursor-pointer hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded border ${
                      projectColors[project.id] ||
                      "bg-primary/10 border-primary/20"
                    }`}
                  >
                    {project.nombre}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(projectVehicleAssignments[project.id] || []).map(
                    (vehicleId) => {
                      const assignedVehicle = vehicles.find(
                        (v) => v.id === vehicleId
                      );
                      return assignedVehicle ? (
                        <span
                          key={vehicleId}
                          className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 shadow-sm border border-blue-200"
                        >
                          <Car className="h-4 w-4 mr-1.5 text-blue-600" />
                          {assignedVehicle.numero_interno} -{" "}
                          {assignedVehicle.patente}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVehicleFromProject(project.id, vehicleId);
                            }}
                            className="ml-2 -mr-1 h-5 w-5 rounded-full bg-blue-200 text-blue-800 hover:bg-blue-300 flex items-center justify-center transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </span>
                      ) : null;
                    }
                  )}

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
            ))}
          </div>
        </div>
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
              vehicles.map((vehicle) =>
                !assignedVehicleIds.has(vehicle.id) ? (
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
                ) : (
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
                )
              )
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
