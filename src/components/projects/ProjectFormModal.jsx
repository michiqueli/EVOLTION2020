import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/lib/supabaseClient";
import FileUploadSection from '@/components/activities/FileUploadSection';

const ProjectFormModal = ({
  isOpen,
  onOpenChange,
  projectData,
  onInputChange,
  onSubmit,
  isEditing,
  canManage,
}) => {
  
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
            {isEditing
              ? "Modifica los detalles del proyecto."
              : "Completa los detalles para registrar un nuevo proyecto."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-foreground">
              Nombre del Proyecto
            </Label>
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
            <Label htmlFor="direccion" className="text-foreground">
              Dirección
            </Label>
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
            <Label htmlFor="descripcion" className="text-foreground">
              Descripción del Proyecto
            </Label>
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

          <FileUploadSection
            filePreviews={
              projectData.documentacion
                ? JSON.parse(projectData.documentacion)
                : []
            }
            handleFileChange={async (e) => {
              const files = Array.from(e.target.files);
              if (!files.length) return;

              const uploadedDocs = [];

              for (const file of files) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${Math.random()
                  .toString(36)
                  .substring(2)}.${fileExt}`;

                try {
                  const { data, error } = await supabase.storage
                    .from("documentacionproyectos")
                    .upload(fileName, file);

                  if (error) throw error;

                  const {
                    data: { publicUrl },
                  } = supabase.storage
                    .from("documentacionproyectos")
                    .getPublicUrl(fileName);

                  uploadedDocs.push({
                    id: fileName, // usamos el nombre como id
                    name: file.name,
                    localPreview: publicUrl,
                    status: "uploaded",
                    url: publicUrl,
                  });
                } catch (error) {
                  console.error("Error al subir el archivo:", error);
                  uploadedDocs.push({
                    id: fileName,
                    name: file.name,
                    status: "error",
                  });
                }
              }

              let prevDocs = [];
              try {
                if (projectData.documentacion) {
                  prevDocs = JSON.parse(projectData.documentacion);
                }
              } catch (err) {
                console.error("Error al parsear documentación previa:", err);
              }

              const allDocs = [...prevDocs, ...uploadedDocs];

              onInputChange({
                target: {
                  name: "documentacion",
                  value: JSON.stringify(allDocs),
                },
              });
            }}
            removeFile={(fileId) => {
              const currentDocs = JSON.parse(projectData.documentacion || "[]");
              const filteredDocs = currentDocs.filter(
                (doc) => doc.id !== fileId
              );

              onInputChange({
                target: {
                  name: "documentacion",
                  value: JSON.stringify(filteredDocs),
                },
              });
            }}
            isUploading={false} // opcional: podrías agregar un estado para mostrar animación
            disabled={!canManage}
          />
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            {canManage && (
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isEditing ? "Guardar Cambios" : "Guardar Proyecto"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormModal;
