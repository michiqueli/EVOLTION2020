import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import FileUploadSection from "@/components/activities/FileUploadSection";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

// Sub-componentes de formulario para mantener el código limpio
const IndustrialForm = ({ data, onChange, disabled }) => (
  <div className="p-4 border rounded-md bg-card mt-4 space-y-4">
    <h4 className="font-medium text-center text-muted-foreground">
      Métricas de Placas Industrial
    </h4>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Placas Instaladas</Label>
        <Input
          type="number"
          name="placas_instaladas"
          value={data.placas_instaladas || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Estructura Instalada</Label>
        <Input
          type="number"
          name="estructura_instalada"
          value={data.estructura_instalada || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Metros de Cable Tendido</Label>
        <Input
          type="number"
          name="metros_cable_tendido"
          value={data.metros_cable_tendido || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Metros de Canalización Realizados</Label>
        <Input
          type="number"
          name="metros_canalizacion_realizada"
          value={data.metros_canalizacion_realizada || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
    </div>
  </div>
);
const HincadoForm = ({ data, onChange, disabled }) => (
  <div className="p-4 border rounded-md bg-card mt-4 space-y-4">
    <h4 className="font-medium text-center text-muted-foreground">
      Métricas de Hincado
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1.5">
        <Label>Hincas Realizadas</Label>
        <Input
          type="number"
          name="hincas_realizadas"
          value={data.hincas_realizadas || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Predrilling Realizado</Label>
        <Input
          type="number"
          name="predrilling_realizado"
          value={data.predrilling_realizado || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Reparto de Hincas</Label>
        <Input
          type="number"
          name="reparto_hincas"
          value={data.reparto_hincas || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
    </div>
  </div>
);
const SeguridadForm = ({ data, onChange, disabled }) => (
  <div className="p-4 border rounded-md bg-card mt-4 space-y-4">
    <h4 className="font-medium text-center text-muted-foreground">
      Métricas de Seguridad en Altura
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Valla Perimetral (m)</Label>
        <Input
          type="number"
          name="valla_perimetral_instalada"
          value={data.valla_perimetral_instalada || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Escaleras Instaladas</Label>
        <Input
          type="number"
          name="escaleras_instaladas"
          value={data.escaleras_instaladas || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Líneas de Vida Instaladas(m)</Label>
        <Input
          type="number"
          name="lineas_de_vida_instaladas"
          value={data.lineas_de_vida_instaladas || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
    </div>
  </div>
);

export const ActivityFormModal = ({
  isOpen,
  onOpenChange,
  projects,
  onSubmit,
  isEditing,
  existingActivity,
}) => {
  const { user, activeProjectId } = useUser();
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({});
  const { toast } = useToast();
  const [filePreviews, setFilePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && existingActivity) {
        // MODO EDICIÓN
        const projectForActivity = projects.find(
          (p) => p.uuid_id === existingActivity.project_id
        );
        setSelectedProject(projectForActivity || null);
        setFormData(existingActivity);
        setFilePreviews(
          existingActivity.imagenes ? JSON.parse(existingActivity.imagenes) : []
        );
      } else {
        // MODO CREACIÓN
        const preSelectedProject = projects.find(
          (p) => p.id === activeProjectId
        );
        setSelectedProject(preSelectedProject || null);
        setFormData({
          project_id: preSelectedProject?.uuid_id || null,
          report_date: new Date().toISOString().split("T")[0],
          user_id: user.uuid_id,
        });
        setFilePreviews([]);
      }
    }
  }, [isOpen, isEditing, existingActivity, projects, user, activeProjectId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (e.target.type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? parseFloat(value) : 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);

    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split(".").pop();
      const storagePath = `${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("almacenamientoinformes")
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("almacenamientoinformes")
          .getPublicUrl(storagePath);

        return {
          id: storagePath,
          name: file.name,
          url: publicUrl,
          storagePath: storagePath,
          status: "uploaded",
        };
      } catch (error) {
        console.error("Error al subir el archivo:", file.name, error);
        return { name: file.name, status: "error" };
      }
    });

    try {
      // Promise.all ejecuta todas las promesas de subida en paralelo
      const results = await Promise.all(uploadPromises);
      // Añadimos los resultados (tanto exitosos como fallidos) a la lista de previsualización
      setFilePreviews((prev) => [...prev, ...results]);
    } catch (error) {
      // Este catch es por si Promise.all falla, aunque es poco probable con la estructura actual
      console.error("Error en el proceso de subida de archivos:", error);
    } finally {
      // Esto se ejecuta siempre, después de que TODAS las subidas hayan terminado
      setIsUploading(false);
    }
  };

  // --- FUNCIÓN DE ELIMINACIÓN CORREGIDA ---
  const removeFile = async (fileId) => {
    const fileToRemove = filePreviews.find((p) => p.id === fileId);
    if (!fileToRemove) return;

    // Si el archivo ya estaba subido (tiene un storagePath), lo borramos de Supabase
    if (fileToRemove.storagePath) {
      try {
        await supabase.storage
          .from("almacenamientoinformes")
          .remove([fileToRemove.storagePath]);
      } catch (error) {
        console.error("Error al borrar del storage:", error);
      }
    }
    // Siempre lo quitamos de la lista en la UI
    setFilePreviews((prev) => prev.filter((p) => p.id !== fileId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Subimos los archivos que están pendientes
      const uploadPromises = filePreviews
        .filter((p) => p.file && !p.url) // Filtramos solo los archivos nuevos sin URL
        .map(async (preview) => {
          const fileExt = preview.file.name.split(".").pop();
          const storagePath = `${user.id}/${Date.now()}-${preview.file.name}`;
          const { error } = await supabase.storage
            .from("almacenamientoinformes")
            .upload(storagePath, preview.file);
          if (error) throw error;
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("almacenamientoinformes")
            .getPublicUrl(storagePath);
          return {
            name: preview.name,
            url: publicUrl,
            storagePath: storagePath,
          };
        });

      const newUploadedFiles = await Promise.all(uploadPromises);
      const existingFiles = filePreviews.filter((p) => p.url);
      const allFiles = [...existingFiles, ...newUploadedFiles];
      const { id, created_at, proyectos, ...dataToSave } = formData;
      const finalData = { ...dataToSave, imagenes: JSON.stringify(allFiles) };

      await onSubmit(finalData, existingActivity?.id);
      onOpenChange(false);
    } catch (err) {
      console.error("Error en el submit del modal:", err);
      toast({
        title: "Error",
        description: "No se pudo guardar el informe.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectSelection = (projectId) => {
    const project = projects.find((p) => p.uuid_id === projectId);
    setSelectedProject(project);
    setFormData((prev) => ({
      ...prev,
      project_id: project ? project.uuid_id : null,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl">
            Crear Nuevo Informe Diario
          </DialogTitle>
          <DialogDescription>
            Selecciona un proyecto y completa las métricas y novedades del día.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Proyecto</Label>
            <Select
              value={selectedProject?.uuid_id || ""}
              onValueChange={handleProjectSelection}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proyecto..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.uuid_id} value={p.uuid_id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProject && (
            <div className="space-y-4 pt-4 border-t">
              {selectedProject.project_type?.includes("placas_industrial") && (
                <IndustrialForm data={formData} onChange={handleInputChange} />
              )}
              {selectedProject.project_type?.includes("hincado") && (
                <HincadoForm data={formData} onChange={handleInputChange} />
              )}
              {selectedProject.project_type?.includes("seguridad_altura") && (
                <SeguridadForm data={formData} onChange={handleInputChange} />
              )}

              <div>
                <Label>Comentarios / Novedades</Label>
                <Textarea
                  name="comentario_libre"
                  onChange={handleInputChange}
                  placeholder="Añade cualquier observación relevante del día..."
                />
              </div>

              <FileUploadSection
                filePreviews={filePreviews}
                setFilePreviews={setFilePreviews}
                handleFileChange={handleFileChange}
                removeFile={removeFile}
                isUploading={isUploading}
                disabled={isSubmitting}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedProject || isSubmitting || isUploading}
            >
              {(isSubmitting || isUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Guardar Cambios" : "Crear Informe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
