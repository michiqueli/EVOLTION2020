import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Car, PlusCircle, Edit3, Trash2, Loader2, Search, ShieldX } from 'lucide-react';

const VEHICLE_TYPES = ['auto', 'pick-up', 'camion', 'hidrogrua'];

const VehicleManagement = () => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    numero_interno: '',
    patente: '',
    marca: '',
    tipo_vehiculo: '',
  });

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('vehiculos')
        .select('*')
        .order('numero_interno', { ascending: true });

      if (fetchError) throw fetchError;
      setVehicles(data || []);
    } catch (e) {
      console.error("Error fetching vehicles:", e);
      setError(`Error al cargar vehículos: ${e.message}`);
      toast({ title: "Error de Carga", description: "No se pudieron cargar los vehículos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, tipo_vehiculo: value }));
  };

  const resetFormData = () => {
    setFormData({ numero_interno: '', patente: '', marca: '', tipo_vehiculo: '' });
    setEditingVehicle(null);
  };

  const openFormModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        numero_interno: vehicle.numero_interno,
        patente: vehicle.patente,
        marca: vehicle.marca || '',
        tipo_vehiculo: vehicle.tipo_vehiculo,
      });
    } else {
      resetFormData();
    }
    setIsFormModalOpen(true);
  };
  
  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetFormData();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let response;
      if (editingVehicle) {
        response = await supabase
          .from('vehiculos')
          .update(formData)
          .eq('id', editingVehicle.id)
          .select();
      } else {
        response = await supabase
          .from('vehiculos')
          .insert(formData)
          .select();
      }

      const { data, error: submissionError } = response;

      if (submissionError) throw submissionError;

      toast({
        title: editingVehicle ? "Vehículo Actualizado" : "Vehículo Creado",
        description: `El vehículo ${data[0].numero_interno} (${data[0].patente}) ha sido ${editingVehicle ? 'actualizado' : 'creado'} exitosamente.`,
        variant: "success",
      });
      fetchVehicles();
      closeFormModal();
    } catch (e) {
      console.error("Error submitting vehicle:", e);
      let description = "No se pudo guardar el vehículo.";
      if (e.message.includes('duplicate key value violates unique constraint "vehiculos_numero_interno_key"')) {
        description = "Ya existe un vehículo con ese número interno.";
      } else if (e.message.includes('duplicate key value violates unique constraint "vehiculos_patente_key"')) {
        description = "Ya existe un vehículo con esa patente.";
      }
      toast({ title: "Error al Guardar", description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteConfirmation = (vehicle) => {
    setVehicleToDelete(vehicle);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    setIsLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('vehiculos')
        .delete()
        .eq('id', vehicleToDelete.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Vehículo Eliminado",
        description: `El vehículo ${vehicleToDelete.numero_interno} ha sido eliminado.`,
        variant: "success",
      });
      fetchVehicles();
    } catch (e) {
      console.error("Error deleting vehicle:", e);
      toast({ title: "Error al Eliminar", description: "No se pudo eliminar el vehículo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsConfirmDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.numero_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicle.marca && vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.05, duration: 0.3 }
    })
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-foreground flex items-center">
          <Car className="mr-3 h-7 w-7 text-primary" /> Gestión de Flota Vehicular
        </h1>
        <Button onClick={() => openFormModal()} className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg">
          <PlusCircle className="h-5 w-5" /> Añadir Nuevo Vehículo
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por N° Interno, Patente o Marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border-border focus:ring-primary focus:border-primary shadow-sm"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      {isLoading && vehicles.length === 0 && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Cargando vehículos...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-6 bg-red-100 dark:bg-red-800/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 flex items-center gap-3 shadow-md">
          <ShieldX className="h-8 w-8" />
          <div>
            <h3 className="font-semibold text-lg">Error Inesperado</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && filteredVehicles.length === 0 && (
        <div className="text-center py-10 bg-card border border-dashed border-border rounded-lg">
          <Car className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">No se encontraron vehículos</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Intenta con otros términos de búsqueda." : "Aún no has añadido ningún vehículo a la flota."}
          </p>
        </div>
      )}

      {filteredVehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={index}
              className="bg-card border border-border rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-primary bg-primary/10 px-3 py-1 rounded-md inline-block">
                    N° Interno: {vehicle.numero_interno}
                  </h2>
                  <span className="text-xs font-semibold uppercase px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground shadow-sm">
                    {vehicle.tipo_vehiculo}
                  </span>
                </div>
                <p className="text-lg font-semibold text-foreground">Patente: <span className="font-bold text-primary">{vehicle.patente}</span></p>
                {vehicle.marca && <p className="text-muted-foreground">Marca: <span className="font-medium text-foreground">{vehicle.marca}</span></p>}
                <p className="text-xs text-muted-foreground pt-1">
                  Registrado: {new Date(vehicle.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-end gap-2 bg-muted/50 p-3 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => openFormModal(vehicle)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-700/20">
                  <Edit3 className="mr-1.5 h-4 w-4" /> Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openDeleteConfirmation(vehicle)} className="text-red-600 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-700/20">
                  <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-md bg-card shadow-2xl rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Car className="h-6 w-6"/>
              {editingVehicle ? "Editar Vehículo" : "Añadir Nuevo Vehículo"}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle ? "Actualiza los detalles del vehículo." : "Completa los detalles del nuevo vehículo para añadirlo a la flota."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div>
              <Label htmlFor="numero_interno" className="font-semibold text-foreground">Número Interno</Label>
              <Input id="numero_interno" name="numero_interno" value={formData.numero_interno} onChange={handleInputChange} required className="mt-1 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <Label htmlFor="patente" className="font-semibold text-foreground">Patente</Label>
              <Input id="patente" name="patente" value={formData.patente} onChange={handleInputChange} required className="mt-1 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <Label htmlFor="marca" className="font-semibold text-foreground">Marca</Label>
              <Input id="marca" name="marca" value={formData.marca} onChange={handleInputChange} className="mt-1 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <Label htmlFor="tipo_vehiculo" className="font-semibold text-foreground">Tipo de Vehículo</Label>
              <Select name="tipo_vehiculo" value={formData.tipo_vehiculo} onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full mt-1 focus:ring-primary focus:border-primary">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                 <Button type="button" variant="outline" onClick={closeFormModal}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingVehicle ? "Guardar Cambios" : "Añadir Vehículo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
                <Trash2 className="mr-2 h-5 w-5"/> Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar el vehículo <span className="font-semibold">{vehicleToDelete?.numero_interno} ({vehicleToDelete?.patente})</span>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-destructive-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sí, Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleManagement;