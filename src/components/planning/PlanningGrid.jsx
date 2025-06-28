import React, { useState, useMemo } from "react";
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
import { cn } from "@/lib/utils";
import { AssignedTaskItem } from "@/components/planning/AssignedTaskItem";
import { useUser } from "@/contexts/UserContext";

const PlanningGridCell = React.memo(
  ({
    tasks,
    employeeId,
    day,
    onRemoveTask,
    onShowTaskDetails,
    onEmptyCellClick,
    employeesList,
  }) => {
    const { user, ROLES } = useUser();
    const isAdminOrCEO =
      user &&
      (user.rol === ROLES.ADMIN ||
        user.rol === ROLES.CEO ||
        user.rol === ROLES.DEVELOPER);

    return (
      <div className="flex-grow flex flex-col space-y-1 overflow-hidden p-1 h-full">
        {tasks.map((task) => (
          <AssignedTaskItem
            key={task.instanceId}
            task={task}
            employeeId={employeeId}
            day={day}
            onRemoveTask={onRemoveTask}
            onShowTaskDetails={onShowTaskDetails}
            employeesList={employeesList}
          />
        ))}
        {tasks.length === 0 && isAdminOrCEO ? (
          <div
            className="flex-grow flex items-center justify-center cursor-pointer group rounded-md hover:bg-muted transition-colors"
            onClick={() => onEmptyCellClick(employeeId, day)}
          >
            <Plus className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary/80 group-hover:scale-110 transition-all" />
          </div>
        ) : (
          <></>
        )}
      </div>
    );
  }
);

export const PlanningGrid = React.memo(
  ({
    employees,
    displayDates,
    assignments,
    onAssignTask,
    onRemoveTask,
    onShowTaskDetails,
    projects,
    isMonthView,
  }) => {
    const [selectedCell, setSelectedCell] = useState(null);
    const [showTaskSelector, setShowTaskSelector] = useState(false);

    const handleEmptyCellClick = (employeeId, dayObject) => {
      setSelectedCell({ employeeId, day: dayObject });
      setShowTaskSelector(true);
    };

    const handleSelectTask = (projectId) => {
      if (selectedCell) {
        onAssignTask(projectId, selectedCell.employeeId, selectedCell.day);
      }
      setShowTaskSelector(false);
      setSelectedCell(null);
    };

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

    let gridContent;

    if (isMonthView) {
      const dayHeaders = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
      ];
      if (employees.length === 0) {
        gridContent = (
          <div className="flex justify-center items-center h-64 text-muted-foreground text-lg">
            Por favor, selecciona un empleado para ver la planificación mensual.
          </div>
        );
      } else {
        const employee = employees[0];
        gridContent = (
          <div className="flex flex-col border-t border-l border-border rounded-lg bg-card shadow-inner overflow-hidden">
            <div className="grid grid-cols-7 bg-muted">
              {dayHeaders.map((header) => (
                <div
                  key={header}
                  className="p-2 text-center text-sm font-semibold text-primary border-r border-b border-border/30"
                >
                  {header}
                </div>
              ))}
            </div>
            {calendarWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 h-full">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${weekIndex}-${dayIndex}`}
                        className="border-r border-b border-border/30 bg-muted/40 min-h-[140px]"
                      ></div>
                    );
                  }
                  // --- CORRECCIÓN 1 ---
                  const cellKey = `${employee.id}-${day.isoDate}`;
                  const cellTasks = assignments[cellKey] || [];
                  return (
                    <div
                      key={day.isoDate}
                      className="border-r border-b border-border/30 min-h-[140px] flex flex-col relative"
                    >
                      <span
                        className={cn(
                          "p-1 text-xs font-semibold",
                          day.isToday
                            ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center m-1"
                            : "text-muted-foreground"
                        )}
                      >
                        {day.dayOfMonth}
                      </span>
                      <PlanningGridCell
                        tasks={cellTasks}
                        employeeId={employee.id}
                        day={day}
                        onRemoveTask={onRemoveTask}
                        onShowTaskDetails={onShowTaskDetails}
                        onEmptyCellClick={handleEmptyCellClick}
                        employeesList={employees}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      }
    } else {
      const gridColsClass = `grid-cols-[80px_repeat(${displayDates.length},minmax(100px,1fr))] md:grid-cols-[120px_repeat(${displayDates.length},minmax(120px,1fr))]`;
      gridContent = (
        <div className="flex-grow overflow-auto rounded-lg border border-border bg-card shadow-inner">
          <div
            className={cn(
              "grid sticky top-0 bg-muted z-20 border-b-2 border-border",
              gridColsClass
            )}
          >
            <div className="p-1 md:p-3 text-[10px] md:text-sm font-semibold text-primary border-r border-border/30 flex items-center justify-center sticky left-0 bg-muted z-10">
              <Users className="h-3 w-3 md:h-5 md:w-5 mr-0.5 md:mr-2" /> Equipo
            </div>
            {displayDates.map((day) => (
              <div
                key={day.isoDate}
                className={cn(
                  "p-1 md:p-3 text-[10px] md:text-sm font-semibold text-primary text-center border-r border-border/30 last:border-r-0",
                  day.isToday &&
                    "bg-primary/10 text-primary-foreground font-bold rounded-t-lg"
                )}
              >
                <span className="block text-xs md:text-sm capitalize">
                  {day.dayName}.
                </span>
                <span className="block text-lg md:text-xl font-bold">
                  {day.dayOfMonth}
                </span>
                <span className="block text-xs md:text-sm text-muted-foreground capitalize">
                  {day.monthName}.
                </span>
              </div>
            ))}
          </div>
          <div>
            {employees.map((employee) => (
              <div className={cn("grid", gridColsClass)} key={employee.id}>
                <div className="p-1 md:p-2 border-r border-b border-border/30 flex flex-col items-center justify-center text-center bg-muted/40 sticky left-0 z-10">
                  <span className="text-[10px] md:text-sm font-medium text-secondary-foreground truncate w-full">
                    {employee.nombre}
                  </span>
                </div>
                {displayDates.map((day) => {
                  // --- CORRECCIÓN 2 ---
                  const cellKey = `${employee.id}-${day.isoDate}`;
                  const cellTasks = assignments[cellKey] || [];
                  return (
                    <motion.div
                      key={cellKey}
                      className="relative h-full border-r border-b border-border/30"
                    >
                      <PlanningGridCell
                        tasks={cellTasks}
                        employeeId={employee.id}
                        day={day}
                        onRemoveTask={onRemoveTask}
                        onShowTaskDetails={onShowTaskDetails}
                        onEmptyCellClick={handleEmptyCellClick}
                        employeesList={employees}
                      />
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
        {gridContent}
        <AlertDialog open={showTaskSelector} onOpenChange={setShowTaskSelector}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader className="text-center">
              <AlertDialogTitle className="text-xl font-bold text-primary">
                Seleccionar Obra
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground">
                Asigna una obra a esta celda de planificación.
              </p>
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
                <p className="text-center text-muted-foreground p-4">
                  No hay obras activas para asignar.
                </p>
              )}
            </div>
            <AlertDialogFooter className="pt-4 flex justify-end">
              <AlertDialogCancel onClick={() => setShowTaskSelector(false)}>
                Cancelar
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);
