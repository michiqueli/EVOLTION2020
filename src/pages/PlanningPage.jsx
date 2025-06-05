// src/pages/PlanningPage.jsx
import React, { useState, useCallback, useEffect } from "react";
import { CalendarDays, Briefcase, Users, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PlanningGrid } from "@/components/planning/PlanningGrid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { daysOfWeek } from "@/components/planning/planningData"; // Asegúrate de que este archivo exista y exporte daysOfWeek
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient"; // Asegúrate de que supabaseClient esté configurado
import { ROLES } from "@/contexts/UserContext"; // Asegúrate de que UserContext y ROLES estén definidos

// Colores base para las tareas (puedes expandir esta lista)
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
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Estado para la asignación de múltiples vehículos por obra
  // { projectId: [vehicleId1, vehicleId2, ...] }
  const [projectVehicleAssignments, setProjectVehicleAssignments] = useState({});

  // Para asegurar colores consistentes para cada proyecto
  const [projectColors, setProjectColors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesResponse, projectsResponse, usersResponse] = await Promise.all([
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

        // Generar colores consistentes para los proyectos
        const initialProjectColors = {};
        (projectsResponse.data || []).forEach((project, index) => {
          initialProjectColors[project.id] = TASK_COLORS[index % TASK_COLORS.length];
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

  // Modificación en onAssignTask: Si ya hay una tarea, la reemplaza.
  const onAssignTask = useCallback((projectId, employeeId, day) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const cellKey = `${employeeId}-${day}`;
    const newAssignment = {
      instanceId: `${project.id}-${employeeId}-${day}-${Date.now()}`,
      projectId: project.id,
      title: project.nombre,
      color: projectColors[project.id], // Asignar el color del proyecto
      vehicleId: null,
      vehicleDisplay: null,
    };

    setAssignments((prev) => ({
      ...prev,
      [cellKey]: [newAssignment], // Reemplaza cualquier tarea existente en esta celda
    }));
    toast({ title: "Tarea asignada", description: `"${project.nombre}" asignada a ${employees.find(e => e.id === employeeId)?.nombre || 'Empleado Desconocido'} el ${day}.` });
  }, [projects, employees, projectColors, toast]); // Añadir projectColors a las dependencias

  const onRemoveTask = useCallback((employeeId, day, instanceIdToRemove) => {
    setAssignments((prev) => {
      const cellKey = `${employeeId}-${day}`;
      const newAssignments = { ...prev };
      delete newAssignments[cellKey]; // Elimina la celda completa
      return newAssignments;
    });
    toast({ title: "Tarea eliminada", description: "La tarea ha sido eliminada de la planificación." });
  }, [toast]);

  const onUpdateAssignmentVehicle = useCallback((employeeId, day, instanceId, newVehicleId) => {
    setAssignments((prev) => {
      const cellKey = `${employeeId}-${day}`;
      const updatedAssignments = (prev[cellKey] || []).map((assignment) => {
        if (assignment.instanceId === instanceId) {
          const vehicle = vehicles.find((v) => v.id === newVehicleId);
          return {
            ...assignment,
            vehicleId: newVehicleId,
            vehicleDisplay: vehicle ? `${vehicle.numero_interno} - ${vehicle.patente}` : null,
          };
        }
        return assignment;
      });
      return {
        ...prev,
        [cellKey]: updatedAssignments,
      };
    });
    toast({ title: "Vehículo actualizado", description: "El vehículo de la tarea ha sido asignado/cambiado." });
  }, [vehicles, toast]);

  const onShowTaskDetails = useCallback((projectId) => {
    navigate(`/projects/${projectId}`);
    toast({ title: "Detalles de Obra", description: `Navegando a los detalles de la obra ${projectId}.` });
  }, [navigate, toast]);

  const onCopyTask = useCallback((taskToCopy, sourceEmployeeId, sourceDay) => {
    toast({ title: "Copiar Tarea", description: `Copiando la tarea "${taskToCopy.title}". (Funcionalidad de pegar no implementada)` });
  }, [toast]);


  // Nuevas funciones para gestionar múltiples vehículos por obra
  const addVehicleToProject = useCallback((projectId, vehicleId) => {
    setProjectVehicleAssignments(prev => ({
      ...prev,
      [projectId]: Array.from(new Set([...(prev[projectId] || []), vehicleId])), // Usa Set para evitar duplicados
    }));
    toast({ title: "Vehículo asignado a obra", description: "Vehículo añadido a la lista de la obra." });
  }, [toast]);

  const removeVehicleFromProject = useCallback((projectId, vehicleId) => {
    setProjectVehicleAssignments(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(id => id !== vehicleId),
    }));
    toast({ title: "Vehículo desasignado de obra", description: "Vehículo eliminado de la lista de la obra." });
  }, [toast]);


  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Planificación Semanal
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        {/* Grilla de Planificación */}
        <div className="w-full">
          <PlanningGrid
            employees={employees}
            daysOfWeek={daysOfWeek}
            assignments={assignments}
            onAssignTask={onAssignTask}
            onRemoveTask={onRemoveTask}
            onUpdateAssignmentVehicle={onUpdateAssignmentVehicle}
            onShowTaskDetails={onShowTaskDetails}
            onCopyTask={onCopyTask}
            projects={projects}
            vehicles={vehicles}
          />
        </div>

        {/* Sección de Obras Activas y Asignación de Vehículos */}
        <div className="bg-card rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Obras Activas y Gestión de Vehículos
          </h2>
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-[1fr,auto] gap-4 items-center p-4 bg-muted/50 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded border ${projectColors[project.id] || "bg-primary/10 border-primary/20"}`}>
                    {project.nombre}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Vehículos asignados a la obra */}
                  {(projectVehicleAssignments[project.id] || []).map(vehicleId => {
                    const assignedVehicle = vehicles.find(v => v.id === vehicleId);
                    return assignedVehicle ? (
                      <span key={vehicleId} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {assignedVehicle.numero_interno} - {assignedVehicle.patente}
                        <button
                          type="button"
                          onClick={() => removeVehicleFromProject(project.id, vehicleId)}
                          className="ml-1 -mr-0.5 h-3 w-3 rounded-full bg-blue-200 text-blue-800 hover:bg-blue-300"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ) : null;
                  })}

                  {/* Selector para añadir nuevos vehículos a la obra */}
                  <Select
                    value="" // Siempre resetear el valor para permitir seleccionar de nuevo
                    onValueChange={(value) => addVehicleToProject(project.id, value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Añadir vehículo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.length > 0 ? (
                        vehicles.map((vehicle) => (
                          // Solo mostrar vehículos que no están ya asignados a esta obra
                          !(projectVehicleAssignments[project.id] || []).includes(vehicle.id) && (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.numero_interno} - {vehicle.patente}
                            </SelectItem>
                          )
                        ))
                      ) : (
                        <SelectItem value="" disabled>No hay vehículos disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningPage;