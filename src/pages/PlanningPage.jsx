import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Briefcase, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PlanningGrid } from "@/components/planning/planningLogic";
import { AvailableTasksPanel } from "@/components/planning/AvailableTasksPanel";
import { AssignVehicleDialog } from "@/components/planning/AssignVehicleDialog";
import {
  initialEmployees,
  daysOfWeek,
} from "@/components/planning/planningData";
import { useNavigate } from "react-router-dom";
import { useUser, ROLES } from "@/contexts/UserContext";
import {
  handleDragStartLogic,
  handleDropLogic,
  handleDragEndLogic,
  handleCellPointerMoveLogic,
  handleCellPointerLeaveLogic,
  handleRemoveTaskLogic,
  handleAssignVehicleClickLogic,
  handleAssignVehicleConfirmLogic,
  handleShowTaskDetailsLogic,
  handleCopyTaskLogic,
  handleImportExcelLogic,
} from "@/components/planning/planningHandlers";
import { supabase } from '@/lib/supabaseClient';


let taskInstanceCounter = 3;

const PlanningPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useUser();
  const isTechnician = user && user.role === ROLES.WORKER;
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [hoveredCell, setHoveredCell] = useState({
    employeeId: null,
    day: null,
  });

  const [employees, setEmployees] = useState(() => {
    if (isTechnician) {
      return initialEmployees.filter(
        (emp) =>
          emp.id === user.id || emp.name.includes(user.name.split(" ")[0])
      );
    }
    return initialEmployees;
  });

  const [availableTasks, setAvailableTasks] = useState([]);
  const [allProjectsAsTasks, setAllProjectsAsTasks] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [projects, setProjects] = useState([]);
  const [isTasksPanelOpen, setIsTasksPanelOpen] = useState(true);
  const [showAssignVehicleDialog, setShowAssignVehicleDialog] = useState(false);
  const [currentTaskForVehicle, setCurrentTaskForVehicle] = useState(null);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("proyectos")
        .select("*")
        .eq("estado", "En Proceso")

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error al cargar proyectos",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const projectsAsTasks = projects.map((project) => ({
      id: project.id,
      title: project.nombre,
      icon: Briefcase,
      color: "bg-gray-400/70 border border-gray-600/30",
      status: "pending",
    }));

    setAllProjectsAsTasks(projectsAsTasks);
    setAvailableTasks(projectsAsTasks);
    setAssignments({});
  }, [projects]);

  const getNewTaskInstanceCounter = () => {
    const current = taskInstanceCounter;
    taskInstanceCounter += 1;
    return current;
  };

  const handleDragStart = useCallback(
    (taskId) => {
      if (isTechnician) return;
      handleDragStartLogic(taskId, setDraggingTaskId);
    },
    [setDraggingTaskId, isTechnician]
  );

  const handleDrop = useCallback(
    (employeeId, day, taskId) => {
      if (isTechnician) return;
      handleDropLogic(
        employeeId,
        day,
        taskId,
        allProjectsAsTasks,
        employees.find((e) => e.id === employeeId)
          ? [employees.find((e) => e.id === employeeId)]
          : initialEmployees,
        setAssignments,
        toast,
        getNewTaskInstanceCounter
      );
    },
    [employees, toast, allProjectsAsTasks, setAssignments, isTechnician]
  );

  const handleDragEnd = useCallback(() => {
    if (isTechnician) return;
    handleDragEndLogic(
      hoveredCell,
      draggingTaskId,
      handleDrop,
      setDraggingTaskId,
      setHoveredCell
    );
  }, [
    hoveredCell,
    draggingTaskId,
    handleDrop,
    setDraggingTaskId,
    setHoveredCell,
    isTechnician,
  ]);

  const handleCellPointerMove = useCallback(
    (employeeId, day) => {
      if (isTechnician) return;
      handleCellPointerMoveLogic(
        employeeId,
        day,
        draggingTaskId,
        setHoveredCell
      );
    },
    [draggingTaskId, setHoveredCell, isTechnician]
  );

  const handleCellPointerLeave = useCallback(() => {
    if (isTechnician) return;
    handleCellPointerLeaveLogic(setHoveredCell);
  }, [setHoveredCell, isTechnician]);

  const handleRemoveTask = useCallback(
    (employeeId, day, taskInstanceIdToRemove) => {
      if (isTechnician) {
        toast({
          title: "Acción no permitida",
          description: "Los técnicos no pueden eliminar tareas.",
          variant: "destructive",
        });
        return;
      }
      handleRemoveTaskLogic(
        employeeId,
        day,
        taskInstanceIdToRemove,
        setAssignments,
        toast
      );
    },
    [setAssignments, toast, isTechnician]
  );

  const handleAssignVehicleClick = useCallback(
    (task, employeeId, day) => {
      if (isTechnician) {
        toast({
          title: "Acción no permitida",
          description: "Los técnicos no pueden asignar vehículos.",
          variant: "destructive",
        });
        return;
      }
      handleAssignVehicleClickLogic(
        task,
        employeeId,
        day,
        setCurrentTaskForVehicle,
        setShowAssignVehicleDialog
      );
    },
    [setCurrentTaskForVehicle, setShowAssignVehicleDialog, isTechnician, toast]
  );

  const handleAssignVehicleConfirm = useCallback(
    (employeeId, day, taskId, vehicle) => {
      if (isTechnician) return;
      handleAssignVehicleConfirmLogic(
        employeeId,
        day,
        taskId,
        vehicle,
        currentTaskForVehicle,
        setAssignments,
        toast,
        setShowAssignVehicleDialog,
        setCurrentTaskForVehicle
      );
    },
    [
      currentTaskForVehicle,
      setAssignments,
      toast,
      setShowAssignVehicleDialog,
      setCurrentTaskForVehicle,
      isTechnician,
    ]
  );

  const handleShowTaskDetails = useCallback(
    (projectId) => {
      handleShowTaskDetailsLogic(projectId, toast, navigate);
    },
    [toast, navigate]
  );

  const handleCopyTask = useCallback(
    (taskToCopy, originalEmployeeId, originalDay) => {
      if (isTechnician) {
        toast({
          title: "Acción no permitida",
          description: "Los técnicos no pueden copiar tareas.",
          variant: "destructive",
        });
        return;
      }
      handleCopyTaskLogic(taskToCopy, toast);
    },
    [toast, isTechnician]
  );

  const handleImportExcel = () => {
    if (isTechnician) {
      toast({
        title: "Acción no permitida",
        description: "Los técnicos no pueden importar datos.",
        variant: "destructive",
      });
      return;
    }
    handleImportExcelLogic(toast);
  };
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col h-[calc(100vh-4rem)] p-2 md:p-4 bg-background text-foreground"
      >
        <div className="flex flex-col md:flex-row items-center justify-between mb-3 md:mb-4 gap-2">
          <h1 className="text-xl md:text-3xl font-bold text-primary flex items-center">
            <CalendarDays className="mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8" />
            Planificación Semanal
          </h1>
          {!isTechnician && (
            <div className="flex gap-2">
              <Button
                onClick={handleImportExcel}
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
              >
                <UploadCloud className="mr-1.5 h-4 w-4" />
                Importar
              </Button>
            </div>
          )}
        </div>

        <div className="flex-grow flex flex-col lg:grid lg:grid-cols-12 gap-3 md:gap-4 overflow-hidden">
          <div className="lg:col-span-9 flex flex-col overflow-hidden h-[50vh] lg:h-auto">
            <PlanningGrid
              employees={employees}
              daysOfWeek={daysOfWeek}
              assignments={assignments}
              hoveredCell={hoveredCell}
              draggingTaskId={draggingTaskId}
              onCellPointerMove={handleCellPointerMove}
              onCellPointerLeave={handleCellPointerLeave}
              onRemoveTask={handleRemoveTask}
              onAssignVehicleClick={handleAssignVehicleClick}
              onShowTaskDetails={handleShowTaskDetails}
              onCopyTask={handleCopyTask}
              isTechnicianView={isTechnician}
            />
          </div>
          {!isTechnician && (
            <div className="lg:col-span-3 flex flex-col mt-3 lg:mt-0 h-[calc(50vh-6rem)] lg:h-auto">
              <AvailableTasksPanel
                tasks={availableTasks}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isOpen={isTasksPanelOpen}
                setIsOpen={setIsTasksPanelOpen}
                isDraggable={!isTechnician}
              />
            </div>
          )}
          {isTechnician && (
            <div className="lg:col-span-3 flex flex-col mt-3 lg:mt-0 h-[calc(50vh-6rem)] lg:h-auto p-4 bg-card rounded-lg shadow">
              <h2 className="text-lg font-semibold text-primary mb-2">
                Mis Tareas
              </h2>
              <p className="text-sm text-muted-foreground">
                Aquí verás un resumen de tus tareas asignadas para la semana.
              </p>
              <p className="text-xs text-muted-foreground mt-auto">
                La modificación de la planificación es gestionada por
                supervisores o administradores.
              </p>
            </div>
          )}
        </div>
        {!isTechnician && (
          <p className="text-center text-xs text-muted-foreground mt-2 md:mt-4">
            Arrastra proyectos activos al calendario. Gestiona estados de
            proyecto en la página de Proyectos.
          </p>
        )}
      </motion.div>

      {!isTechnician && (
        <AssignVehicleDialog
          isOpen={showAssignVehicleDialog}
          onOpenChange={setShowAssignVehicleDialog}
          taskInfo={currentTaskForVehicle}
          onAssignVehicleConfirm={handleAssignVehicleConfirm}
        />
      )}
    </>
  );
};

export default PlanningPage;
