// src/components/planning/PlanningGrid.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AssignedTaskItem } from "@/components/planning/AssignedTaskItem";

// Importar isToday de date-fns para resaltar el día actual
import { isToday } from 'date-fns';

const PlanningGridCell = React.memo(
  ({
    tasks,
    employeeId,
    // day ya no es un string simple, ahora es un objeto { fullDate, dayName, dayOfMonth, monthName, isToday }
    day, // Recibe el objeto completo 'day'
    onRemoveTask,
    onShowTaskDetails,
    employeesList,
    onEmptyCellClick
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
            // Pasa el objeto day completo a AssignedTaskItem si se usa en su lógica (actualmente no, pero por si acaso)
            day={day}
            onRemoveTask={onRemoveTask}
            onShowTaskDetails={onShowTaskDetails}
            employeesList={employeesList}
          />
        ))}

        {tasks.length === 0 && (
          <div
            className="flex-grow flex items-center justify-center cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
            // Pasa el objeto day completo a onEmptyCellClick
            onClick={() => onEmptyCellClick(employeeId, day)}
          >
            <Plus className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground hover:text-primary transition-colors" />
          </div>
        )}
      </div>
    );
  }
);


export const PlanningGrid = React.memo(
  ({
    employees,
    // daysOfWeek ya no se recibe
    weekDates, // <--- Recibe el array de objetos de fecha
    assignments,
    onAssignTask,
    onRemoveTask,
    onShowTaskDetails,
    projects,
    vehicles,
  }) => {
    const [selectedCell, setSelectedCell] = useState(null);
    const [showTaskSelector, setShowTaskSelector] = useState(false);

    // handleEmptyCellClick ahora espera un objeto 'day' completo
    const handleEmptyCellClick = (employeeId, dayObject) => {
      setSelectedCell({ employeeId, day: dayObject }); // Guarda el objeto completo
      setShowTaskSelector(true);
    };

    // handleSelectTask ahora espera un objeto 'day' completo desde selectedCell
    const handleSelectTask = (projectId) => {
      if (selectedCell) {
        onAssignTask(projectId, selectedCell.employeeId, selectedCell.day); // Pasa el objeto day
      }
      setShowTaskSelector(false);
      setSelectedCell(null);
    };

    return (
      <>
        <div className="flex-grow overflow-auto rounded-lg border border-border bg-card shadow-inner">
          {/* Encabezado de la Grilla (Días de la semana con fechas) */}
          <div className="grid grid-cols-[80px_repeat(7,minmax(100px,1fr))] md:grid-cols-[120px_repeat(7,minmax(120px,1fr))] sticky top-0 bg-muted z-20 border-b-2 border-border">
            <div className="p-1 md:p-3 text-[10px] md:text-sm font-semibold text-primary border-r border-border/30 flex items-center justify-center sticky left-0 bg-muted z-10">
              <Users className="h-3 w-3 md:h-5 md:w-5 mr-0.5 md:mr-2" /> Equipo
            </div>
            {weekDates.map((day) => ( // Iterar sobre weekDates
              <div
                key={day.fullDate.toISOString()} // Usar la fecha completa como clave única
                className={cn(
                  "p-1 md:p-3 text-[10px] md:text-sm font-semibold text-primary text-center border-r border-border/30 last:border-r-0",
                  day.isToday && "bg-primary/10 text-primary-foreground font-bold rounded-t-lg" // Resaltar el día actual
                )}
              >
                <span className="block text-xs md:text-sm">{day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1)}.</span> {/* Lunes, Martes, etc. */}
                <span className="block text-lg md:text-xl font-bold">{day.dayOfMonth}</span> {/* 6, 7, etc. */}
                <span className="block text-xs md:text-sm text-muted-foreground">{day.monthName}.</span> {/* Jun, Jul, etc. */}
              </div>
            ))}
          </div>

          {/* Filas de la Grilla (Empleados y sus celdas de tareas) */}
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
                {weekDates.map((day) => { // Iterar sobre weekDates
                  const cellKey = `${employee.id}-${day.fullDate.toISOString().split('T')[0]}`; // Usar la fecha ISO como clave
                  const cellTasks = assignments[cellKey] || [];

                  return (
                    <motion.div
                      key={cellKey} // Clave basada en employee y fecha
                      className="relative"
                    >
                      <PlanningGridCell
                        tasks={cellTasks}
                        employeeId={employee.id}
                        day={day} // Pasa el objeto day completo
                        onRemoveTask={onRemoveTask}
                        onShowTaskDetails={onShowTaskDetails}
                        employeesList={employees}
                        onEmptyCellClick={handleEmptyCellClick}
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
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader className="text-center">
              <AlertDialogTitle className="text-xl font-bold text-primary">Seleccionar Obra</AlertDialogTitle>
              <p className="text-sm text-muted-foreground">Asigna una obra a esta celda de planificación.</p>
            </AlertDialogHeader>
            <div className="grid gap-3 max-h-[300px] overflow-auto p-2 border rounded-md bg-accent/20">
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
            <AlertDialogFooter className="pt-4 flex justify-end">
              <AlertDialogCancel onClick={() => setShowTaskSelector(false)}>Cancelar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);