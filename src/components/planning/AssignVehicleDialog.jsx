import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Car } from 'lucide-react';
import { availableVehicles } from './planningData';

export const AssignVehicleDialog = ({ isOpen, onOpenChange, taskInfo, onAssignVehicleConfirm }) => {
  const [vehicleInput, setVehicleInput] = useState("");

  useEffect(() => {
    if (taskInfo) {
      setVehicleInput(taskInfo.currentVehicle || "");
    }
  }, [taskInfo]);

  if (!taskInfo) return null;

  const handleSubmit = () => {
    onAssignVehicleConfirm(taskInfo.employeeId, taskInfo.day, taskInfo.taskId, vehicleInput);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setVehicleInput(""); 
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Furgoneta a "{taskInfo.taskTitle}"</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vehicle-assign-input" className="text-right">
              Furgoneta
            </Label>
            <Input
              id="vehicle-assign-input"
              value={vehicleInput}
              onChange={(e) => setVehicleInput(e.target.value)}
              className="col-span-3"
              placeholder="Ej: Ford Transit Placa XYZ"
            />
          </div>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="col-span-4 w-full">Seleccionar de lista</Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                  <DropdownMenuContent className="w-[calc(100vw-4rem)] max-w-[380px] sm:w-auto">
                  {availableVehicles.map(v => (
                      <DropdownMenuItem key={v.id} onSelect={() => { setVehicleInput(v.name); }}>
                      <Car className="mr-2 h-4 w-4" /> {v.name}
                      </DropdownMenuItem>
                  ))}
                  {availableVehicles.length === 0 && <DropdownMenuItem disabled>No hay furgonetas disponibles</DropdownMenuItem>}
                  </DropdownMenuContent>
              </DropdownMenuPortal>
          </DropdownMenu>
        </div>
        <DialogFooter>
          <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>Guardar Furgoneta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};