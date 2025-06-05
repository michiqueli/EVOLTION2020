import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Briefcase, Car, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PlanningGrid } from "@/components/planning/PlanningGrid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { daysOfWeek } from "@/components/planning/planningData";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { ROLES } from "@/contexts/UserContext";

const PlanningPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [hoveredCell, setHoveredCell] = useState({
    employeeId: null,
    day: null,
  });
  const [assignments, setAssignments] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesResponse, projectsResponse, userResponse] =
          await Promise.all([
            supabase.from("vehiculos").select("*").order("numero_interno"),
            supabase.from("proyectos").select("*").eq("estado", "En Proceso"),
            supabase.from("usuarios").select("*").eq("rol", ROLES.WORKER),
          ]);

        if (vehiclesResponse.error) throw vehiclesResponse.error;
        if (projectsResponse.error) throw projectsResponse.error;
        if (userResponse.error) throw userResponse.error;

        setVehicles(vehiclesResponse.data || []);
        setProjects(projectsResponse.data || []);
        setUsers(userResponse.data || []);
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

  const onAssignTask = (taskId, employeeId, day) => {
    const project = projects.find((p) => p.id.toString() === taskId);
    if (!project) return;

    const cellKey = `${employeeId}-${day}`;
    setAssignments((prev) => ({
      ...prev,
      [cellKey]: [
        ...(prev[cellKey] || []),
        {
          id: `${project.id}-${Date.now()}`,
          projectId: project.id,
          title: project.nombre,
          vehicle: selectedVehicles[project.id] || null,
        },
      ],
    }));
  };
  console.log(assignments)

  const handleVehicleSelect = (projectId, vehicleId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    setSelectedVehicles((prev) => ({
      ...prev,
      [projectId]: `${vehicle.numero_interno} - ${vehicle.patente}`,
    }));
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Planificación Semanal
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        <div className="w-full">
          <PlanningGrid
            tasks={projects}
            employees={users}
            daysOfWeek={daysOfWeek}
            assignments={assignments}
            hoveredCell={hoveredCell}
            setHoveredCell={setHoveredCell}
            onAssignTask={onAssignTask}
          />
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Obras Activas y Asignación de Vehículos
          </h2>
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-[1fr,auto] gap-4 items-center p-4 bg-muted/50 rounded-lg border"
              >
                <div
                  draggable
                  onDragStart={() => handleDragStart(project.id.toString())}
                  className="flex items-center gap-2 cursor-move"
                >
                  <div className="p-2 bg-primary/10 rounded border border-primary/20">
                    {project.nombre}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={selectedVehicles[project.id] || ""}
                    onValueChange={(value) =>
                      handleVehicleSelect(project.id, value)
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Seleccionar vehículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.numero_interno} - {vehicle.patente}
                        </SelectItem>
                      ))}
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
