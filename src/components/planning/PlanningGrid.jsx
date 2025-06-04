import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MoreVertical, Trash2, Copy, Car, Info, Edit3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
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

import { cn } from '@/lib/utils';


const AssignedTaskItem = React.memo(({ task, employeeId, day, onRemoveTask, onAssignVehicleClick, onShowTaskDetails, onCopyTask, employeesList }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const employeeName = employeesList.find(e => e.id === employeeId)?.name || employeeId;

  return (
    <>
      <div className={`group relative p-1 md:p-1.5 rounded-sm text-[10px] md:text-[11px] ${task.color || 'bg-yellow-400/70 border border-yellow-600/30'} text-black shadow-sm overflow-hidden`}>
        <div className="flex justify-between items-start">
          <div className="flex-grow min-w-0">
            <p className="font-semibold truncate">{task.title}</p>
            {task.vehicle && (
              <div className="flex items-center text-[9px] md:text-[10px] opacity-80 mt-0.5">
                <Car className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{task.vehicle}</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 md:h-6 md:w-6 opacity-70 group-hover:opacity-100 focus:opacity-100 -mr-1 -mt-0.5 flex-shrink-0">
                <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border shadow-xl">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAssignVehicleClick(task, employeeId, day)}>
                <Edit3 className="mr-2 h-3.5 w-3.5" />
                {task.vehicle ? "Cambiar Furgoneta" : "Asignar Furgoneta"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShowTaskDetails(task.projectId)}>
                <Info className="mr-2 h-3.5 w-3.5" />
                Info Obra
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyTask(task, employeeId, day)}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copiar Tarea
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea asignada?</AlertDialogTitle>
            <AlertDialogDescription>
              La tarea "{task.title}" será eliminada de la planificación de {employeeName} para el {day}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onRemoveTask(employeeId, day, task.instanceId)} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

const PlanningGridCell = React.memo(({ tasks, employeeId, day, isHovered, onRemoveTask, onAssignVehicleClick, onShowTaskDetails, onCopyTask, employeesList }) => {
  return (
    <div
      className={cn(
        "border-b border-r border-border/30 p-1 min-h-[70px] md:min-h-[90px] flex flex-col space-y-1 relative transition-colors duration-100 ease-in-out overflow-hidden",
        isHovered ? "bg-primary/20 ring-1 ring-primary inset-0" : "bg-card-foreground/5 hover:bg-card-foreground/10"
      )}
    >
      {tasks.map(task => (
        <AssignedTaskItem 
          key={task.instanceId} 
          task={task} 
          employeeId={employeeId} 
          day={day} 
          onRemoveTask={onRemoveTask}
          onAssignVehicleClick={onAssignVehicleClick}
          onShowTaskDetails={onShowTaskDetails}
          onCopyTask={onCopyTask}
          employeesList={employeesList}
        />
      ))}
      {tasks.length === 0 && <div className="flex-grow"></div>}
    </div>
  );
});

const EmployeeRow = React.memo(({ employee, daysOfWeek, assignments, hoveredCell, draggingTaskId, onCellPointerMove, onCellPointerLeave, onRemoveTask, onAssignVehicleClick, onShowTaskDetails, onCopyTask, employeesList }) => (
  <div className="grid grid-cols-[80px_repeat(7,minmax(100px,1fr))] md:grid-cols-[120px_repeat(7,minmax(120px,1fr))] items-stretch">
    <div className="p-1 md:p-2 border-r border-b border-border/30 flex flex-col items-center justify-center text-center bg-muted/40 sticky left-0 z-10">
      <Avatar className="h-8 w-8 md:h-10 md:w-10 mb-0.5 md:mb-1">
        <AvatarImage src={employee.avatar} alt={employee.name} />
        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <span className="text-[10px] md:text-sm font-medium text-secondary-foreground truncate w-full">{employee.name}</span>
    </div>
    {daysOfWeek.map(day => {
      const cellKey = `${employee.id}-${day}`;
      return (
        <motion.div
          key={cellKey}
          className="relative"
          onPointerMove={() => draggingTaskId && onCellPointerMove(employee.id, day)}
          onPointerLeave={() => draggingTaskId && onCellPointerLeave()}
        >
          <PlanningGridCell
            tasks={assignments[cellKey] || []}
            employeeId={employee.id}
            day={day}
            isHovered={hoveredCell.employeeId === employee.id && hoveredCell.day === day && !!draggingTaskId}
            onRemoveTask={onRemoveTask}
            onAssignVehicleClick={onAssignVehicleClick}
            onShowTaskDetails={onShowTaskDetails}
            onCopyTask={onCopyTask}
            employeesList={employeesList}
          />
        </motion.div>
      );
    })}
  </div>
));

export const PlanningGrid = React.memo(({ employees, daysOfWeek, assignments, hoveredCell, draggingTaskId, onCellPointerMove, onCellPointerLeave, onRemoveTask, onAssignVehicleClick, onShowTaskDetails, onCopyTask }) => (
  <div className="flex-grow overflow-auto rounded-lg border border-border bg-card shadow-inner">
    <div className="grid grid-cols-[80px_repeat(7,minmax(100px,1fr))] md:grid-cols-[120px_repeat(7,minmax(120px,1fr))] sticky top-0 bg-muted z-20 border-b-2 border-border">
      <div className="p-1 md:p-3 text-[10px] md:text-sm font-semibold text-primary border-r border-border/30 flex items-center justify-center sticky left-0 bg-muted z-10">
        <Users className="h-3 w-3 md:h-5 md:w-5 mr-0.5 md:mr-2"/> Equipo
      </div>
      {daysOfWeek.map(day => (
        <div key={day} className="p-1 md:p-3 text-[10px] md:text-sm font-semibold text-primary text-center border-r border-border/30 last:border-r-0">
          {day.substring(0,3)}
        </div>
      ))}
    </div>
    <div className="min-w-[780px] md:min-w-[960px]">
      {employees.map(employee => (
        <EmployeeRow
          key={employee.id}
          employee={employee}
          daysOfWeek={daysOfWeek}
          assignments={assignments}
          hoveredCell={hoveredCell}
          draggingTaskId={draggingTaskId}
          onCellPointerMove={onCellPointerMove}
          onCellPointerLeave={onCellPointerLeave}
          onRemoveTask={onRemoveTask}
          onAssignVehicleClick={onAssignVehicleClick}
          onShowTaskDetails={onShowTaskDetails}
          onCopyTask={onCopyTask}
          employeesList={employees} 
        />
      ))}
    </div>
  </div>
));