
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Car, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export const AssignVehicleDialog = ({ isOpen, onOpenChange, taskInfo, onAssignVehicleConfirm }) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('vehiculos')
          .select('*')
          .order('numero_interno');

        if (error) throw error;
        setVehicles(data || []);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchVehicles();
      if (taskInfo?.currentVehicle) {
        setSelectedVehicle(taskInfo.currentVehicle);
      } else {
        setSelectedVehicle("");
      }
    }
  }, [isOpen, taskInfo]);

  const handleSubmit = () => {
    onAssignVehicleConfirm(taskInfo.employeeId, taskInfo.day, taskInfo.taskId, selectedVehicle);
  };

  if (!taskInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setSelectedVehicle("");
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Asignar Vehículo a "{taskInfo.taskTitle}"
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vehicle-select" className="text-right">
              Vehículo
            </Label>
            <Select
              value={selectedVehicle}
              onValueChange={setSelectedVehicle}
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un vehículo" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={`${vehicle.numero_interno} - ${vehicle.patente}`}>
                      {vehicle.numero_interno} - {vehicle.patente} ({vehicle.tipo_vehiculo})
                    </SelectItem>
                  ))
                )}
                {!isLoading && vehicles.length === 0 && (
                  <SelectItem value="" disabled>No hay vehículos disponibles</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isLoading || !selectedVehicle}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Vehículo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};