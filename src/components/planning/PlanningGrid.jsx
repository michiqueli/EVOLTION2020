// src/components/planning/PlanningGrid.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AssignedTaskItem } from "@/components/planning/AssignedTaskItem";

const PlanningGridCell = React.memo(
  ({
    tasks,
    employeeId,
    day,
    onRemoveTask,
    onUpdateAssignmentVehicle,
    onShowTaskDetails,
    onCopyTask,
    employeesList,
    vehicles,
  }) => {
    return (
      <div
        className={cn(
          "border-b border-r border-border/30 p-1 min-h-[30px] md:min-h-[50px] flex flex-col space-y-1 relative transition-colors duration-100 ease-in-out overflow-hidden",
          "bg-card-foreground/5 hover:bg-card-foreground/10"
        )}
      >
        {tasks.map((task) => (
          <AssignedTaskItem
            key={task.instanceId}
            task={task}
            employeeId={employeeId}
            day={day}
            onRemoveTask={onRemoveTask}
            onAssignVehicleClick={onUpdateAssignmentVehicle}
            onShowTaskDetails={onShowTaskDetails}
            onCopyTask={onCopyTask}
            employeesList={employeesList}
            vehicles={vehicles}
          />
        ))}
        {tasks.length === 0 && <div className="flex-grow"></div>}
      </div>
    );
  }
);

export const PlanningGrid = React.memo(
  ({
    employees,
    daysOfWeek,
    assignments,
    onAssignTask,
    onRemoveTask,
    onUpdateAssignmentVehicle,
    onShowTaskDetails,
    onCopyTask,
    projects,
    vehicles,
  }) => {
    const [selectedCell, setSelectedCell] = useState(null);
    const [showTaskSelector, setShowTaskSelector] = useState(false);

    // Función para manejar el clic en una celda de la grilla
    const handleCellClick = (employeeId, day, cellTasks) => {
      // Solo abrir el selector si la celda está vacía
      if (cellTasks.length === 0) {
        setSelectedCell({ employeeId, day });
        setShowTaskSelector(true);
      }
      // Si la celda no está vacía, no se abre el selector al hacer clic en ella.
      // Las acciones sobre la tarea se realizan desde el DropdownMenu de la tarea misma.
    };

    const handleSelectTask = (projectId) => {
      if (selectedCell) {
        onAssignTask(projectId, selectedCell.employeeId, selectedCell.day);
      }
      setShowTaskSelector(false);
      setSelectedCell(null);
    };

    return (
      <>
        <div className="flex-grow overflow-auto rounded-lg border border-border bg-card shadow-inner">
          {/* Encabezado de la Grilla */}
          <div className="grid grid-cols-[80px_repeat(7,minmax(100px,1fr))] md:grid-cols-[120px_repeat(7,minmax(120px,1fr))] sticky top-0 bg-muted z-20 border-b-2 border-border">
            <div className="p-1 md:p-3 text-[10px] md:text-sm font-semibold text-primary border-r border-border/30 flex items-center justify-center sticky left-0 bg-muted z-10">
              <Users className="h-3 w-3 md:h-5 md:w-5 mr-0.5 md:mr-2" /> Equipo
            </div>
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="p-1 md:p-3 text-[10px] md:text-sm font-semibold text-primary text-center border-r border-border/30 last:border-r-0"
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Filas de la Grilla */}
          <div className="min-w-[780px] md:min-w-[960px]">
            {employees.map((employee) => (
              <div
                className="grid grid-cols-[80px_repeat(7,minmax(60px,1fr))] md:grid-cols-[120px_repeat(7,minmax(80px,1fr))]"
                key={employee.id}
              >
                {/* Columna de Empleado */}
                <div className="p-1 md:p-2 border-r border-b border-border/30 flex flex-col items-center justify-center text-center bg-muted/40 sticky left-0 z-10">
                  <span className="text-[10px] md:text-sm font-medium text-secondary-foreground truncate w-full">
                    {employee.nombre}
                  </span>
                </div>
                {/* Celdas de Días para el Empleado */}
                {daysOfWeek.map((day) => {
                  const cellKey = `${employee.id}-${day}`;
                  const cellTasks = assignments[cellKey] || [];

                  return (
                    <motion.div
                      key={cellKey}
                      className="relative"
                      onClick={() => handleCellClick(employee.id, day, cellTasks)} // Pasa cellTasks para la lógica condicional
                    >
                      <PlanningGridCell
                        tasks={cellTasks}
                        employeeId={employee.id}
                        day={day}
                        onRemoveTask={onRemoveTask}
                        onUpdateAssignmentVehicle={onUpdateAssignmentVehicle}
                        onShowTaskDetails={onShowTaskDetails}
                        onCopyTask={onCopyTask}
                        employeesList={employees}
                        vehicles={vehicles}
                      />
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selector de Obra (AlertDialog) */}
        <AlertDialog open={showTaskSelector} onOpenChange={setShowTaskSelector}>
          <AlertDialogContent className="sm:max-w-md"> {/* Mejora del estilo del modal */}
            <AlertDialogHeader className="text-center">
              <AlertDialogTitle className="text-xl font-bold text-primary">Seleccionar Obra</AlertDialogTitle>
              <p className="text-sm text-muted-foreground">Asigna una obra a esta celda de planificación.</p>
            </AlertDialogHeader>
            <div className="grid gap-3 max-h-[300px] overflow-auto p-2 border rounded-md bg-accent/20"> {/* Estilo de la lista */}
              {projects.length > 0 ? (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectTask(project.id)}
                    className="flex items-center gap-2 p-3 rounded-md border border-border bg-background hover:bg-muted/70 transition-colors duration-200 text-left text-sm font-medium shadow-sm"
                  >
                    <Briefcase className="h-4 w-4 text-primary" />
                    {project.nombre}
                  </button>
                ))
              ) : (
                <p className="text-center text-muted-foreground p-4">No hay obras activas para asignar.</p>
              )}
            </div>
            {/* Opcional: Footer con un botón de "Cerrar" si no hay obras */}
            {projects.length === 0 && (
                <div className="flex justify-end pt-4">
                    <Button onClick={() => setShowTaskSelector(false)} variant="outline">Cerrar</Button>
                </div>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);