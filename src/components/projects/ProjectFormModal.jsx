
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/lib/supabaseClient';

const ProjectFormModal = ({ 
  isOpen, 
  onOpenChange, 
  projectData, 
  onInputChange, 
  onSubmit, 
  isEditing,
  canManage 
}) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Crear un nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      try {
        // Subir el archivo a Supabase Storage
        const { data, error } = await supabase.storage
          .from('almacenamientoinformes')
          .upload(fileName, file);

        if (error) throw error;

        // Obtener la URL pública del archivo
        const { data: { publicUrl } } = supabase.storage
          .from('almacenamientoinformes')
          .getPublicUrl(fileName);

        // Actualizar el estado del proyecto con la URL del archivo
        onInputChange({
          target: {
            name: 'documentacion',
            value: publicUrl
          }
        });
      } catch (error) {
        console.error('Error al subir el archivo:', error);
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (canManage) {
      onSubmit(e);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl">
            {isEditing ? "Editar Proyecto" : "Crear Nuevo Proyecto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los detalles del proyecto." : "Completa los detalles para registrar un nuevo proyecto."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-foreground">Nombre del Proyecto</Label>
            <Input 
              id="nombre" 
              name="nombre" 
              value={projectData.nombre} 
              onChange={onInputChange} 
              placeholder="Ej: Instalación Edificio Central" 
              className="bg-card border-input" 
              required 
              disabled={!canManage} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="direccion" className="text-foreground">Dirección</Label>
            <Input 
              id="direccion" 
              name="direccion" 
              value={projectData.direccion} 
              onChange={onInputChange} 
              placeholder="Ej: Calle Falsa 123, Ciudad" 
              className="bg-card border-input" 
              required
              disabled={!canManage} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-foreground">Descripción del Proyecto</Label>
            <Textarea 
              id="descripcion" 
              name="descripcion" 
              value={projectData.descripcion} 
              onChange={onInputChange} 
              placeholder="Detalles adicionales sobre el proyecto..." 
              className="bg-card border-input min-h-[100px]" 
              disabled={!canManage} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentacion" className="text-foreground">Documentación</Label>
            <Input 
              id="documentacion" 
              name="documentacion" 
              type="file"
              onChange={handleFileChange}
              className="bg-card border-input" 
              disabled={!canManage}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
            {projectData.documentacion && (
              <p className="text-sm text-muted-foreground mt-2">
                Archivo actual: {projectData.documentacion.split('/').pop()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones" className="text-foreground">Observaciones</Label>
            <Input 
              id="observaciones" 
              name="observaciones" 
              value={projectData.observaciones} 
              onChange={onInputChange} 
              placeholder="Observaciones adicionales..." 
              className="bg-card border-input" 
              disabled={!canManage} 
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            {canManage && <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{isEditing ? "Guardar Cambios" : "Guardar Proyecto"}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormModal;