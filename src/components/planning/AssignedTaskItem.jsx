import React, { useState } from "react";
import {
  MoreVertical,
  Trash2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export const AssignedTaskItem = React.memo(
  ({
    task,
    employeeId,
    day,
    onRemoveTask,
    onShowTaskDetails,
    employeesList,
  }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const employeeName =
      employeesList.find((e) => e.id === employeeId)?.nombre || employeeId;
    const formattedDayForDisplay = day.fullDate ? format(day.fullDate, 'EEEE d \'de\' MMMM', { locale: es }) : day.dayName;


    return (
      <>
        <div
          className={`group relative p-1 md:p-1.5 rounded-sm text-[10px] md:text-[11px] ${
            task.color || "bg-gray-200 border border-gray-400"
          } text-black shadow-sm overflow-hidden`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-grow min-w-0 text-center">
              <p className="font-semibold text-sm truncate">{task.title}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 md:h-6 md:w-6 opacity-70 group-hover:opacity-100 focus:opacity-100 -mr-1 -mt-0.5 flex-shrink-0"
                >
                  <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-card border-border shadow-xl"
              >
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onShowTaskDetails(task.projectId)}>
                  <Info className="mr-2 h-3.5 w-3.5" />
                  Info Obra
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* AlertDialog para confirmar eliminación */}
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿Eliminar esta tarea asignada?
              </AlertDialogTitle>
              <AlertDialogDescription>
                La tarea "{task.title}" será eliminada de la planificación de{" "}
                <span className="font-semibold">{employeeName}</span> para el{" "}
                <span className="font-semibold">{formattedDayForDisplay}</span>. {/* <--- CAMBIO AQUÍ */}
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRemoveTask(employeeId, day.fullDate.toISOString().split('T')[0], task.instanceId)} // <--- Asegúrate que onRemoveTask reciba la fecha formateada si la usa como clave
                className="bg-destructive hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);