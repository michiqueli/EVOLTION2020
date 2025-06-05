// src/components/planning/AssignedTaskItem.jsx
import React, { useState } from "react";
import { MoreVertical, Trash2, Copy, Car, Info, Edit3 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

export const AssignedTaskItem = React.memo(
  ({
    task, // Contiene: { instanceId, projectId, title, vehicleId, vehicleDisplay, color }
    employeeId,
    day,
    onRemoveTask,
    onAssignVehicleClick,
    onShowTaskDetails,
    onCopyTask,
    employeesList,
    vehicles,
  }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showVehicleSelector, setShowVehicleSelector] = useState(false);
    const [selectedVehicleForAssignment, setSelectedVehicleForAssignment] =
      useState(task.vehicleId || "");

    const employeeName =
      employeesList.find((e) => e.id === employeeId)?.nombre || employeeId;

    const handleVehicleAssignment = () => {
      onAssignVehicleClick(
        employeeId,
        day,
        task.instanceId,
        selectedVehicleForAssignment
      );
      setShowVehicleSelector(false);
    };

    return (
      <>
        <div
          // Usa task.color directamente para el fondo y el borde
          className={`group relative p-1 md:p-1.5 rounded-sm text-[10px] md:text-[11px] ${
            task.color || "bg-gray-200 border border-gray-400" // Fallback si no hay color
          } text-black shadow-sm overflow-hidden`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-grow min-w-0">
              <p className="font-semibold truncate">{task.title}</p>
              {task.vehicleDisplay && (
                <div className="flex items-center text-[9px] md:text-[10px] opacity-80 mt-0.5">
                  <Car className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{task.vehicleDisplay}</span>
                </div>
              )}
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
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedVehicleForAssignment(task.vehicleId || "");
                    setShowVehicleSelector(true);
                  }}
                >
                  <Edit3 className="mr-2 h-3.5 w-3.5" />
                  {task.vehicleDisplay
                    ? "Cambiar Furgoneta"
                    : "Asignar Furgoneta"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onShowTaskDetails(task.projectId)}
                >
                  <Info className="mr-2 h-3.5 w-3.5" />
                  Info Obra
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onCopyTask(task, employeeId, day)}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copiar Tarea
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
                <span className="font-semibold">{day}</span>. Esta acción no se
                puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRemoveTask(employeeId, day, task.instanceId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* AlertDialog para seleccionar/cambiar vehículo */}
        <AlertDialog
          open={showVehicleSelector}
          onOpenChange={setShowVehicleSelector}
        >
          <AlertDialogContent className="sm:max-w-md">
            {" "}
            {/* Mejora del estilo del modal */}
            <AlertDialogHeader className="text-center">
              <AlertDialogTitle className="text-xl font-bold text-primary">
                Asignar Furgoneta
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona una furgoneta para la tarea:{" "}
                <span className="font-semibold">{task.title}</span>
              </p>
            </AlertDialogHeader>
            <div className="p-2 border rounded-md bg-accent/20">
              <Select
                value={selectedVehicleForAssignment}
                onValueChange={setSelectedVehicleForAssignment}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length > 0 ? (
                    vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.numero_interno} - {vehicle.patente}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No hay vehículos disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowVehicleSelector(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleVehicleAssignment}>
                Asignar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);
