import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import FileUploadSection from "@/components/activities/FileUploadSection";

const PROJECT_TYPES = [
  { value: "placas_industrial", label: "Placas Industrial" },
  { value: "placas_domesticas", label: "Placas Domésticas" },
  { value: "hincado", label: "Hincado" },
  { value: "seguridad_altura", label: "Seguridad en Altura" },
  { value: "otro", label: "Otro" },
];

const PROJECT_TYPE_FIELDS = {
  placas_industrial: ["placas_a_instalar", "estructura_a_instalar", "metros_cable", "metros_canalizacion"],
  hincado: ["hincas", "predrilling", "hincas_repartir"],
  seguridad_altura: ["valla_perimetral", "escaleras_instaladas", "lineas_vida"],
};

// --- Sub-componentes para cada formulario para mantener el código limpio ---
const IndustrialForm = ({ data, onChange, disabled }) => (
  <div className="p-4 border rounded-md bg-card mt-4 space-y-4">
    <h4 className="font-medium text-center text-muted-foreground">
      Cantidades para Placas Industrial
    </h4>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Placas por Instalar</Label>
        <Input
          type="number"
          name="placas_a_instalar"
          value={data?.placas_a_instalar || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Estructura por Instalar</Label>
        <Input
          type="number"
          name="estructura_a_instalar"
          value={data?.estructura_a_instalar || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Metros de Cable</Label>
        <Input
          type="number"
          name="metros_cable"
          value={data?.metros_cable || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Metros de Canalización</Label>
        <Input
          type="number"
          name="metros_canalizacion"
          value={data?.metros_canalizacion || ""}
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
      Cantidades para Hincado
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1.5">
        <Label>Hincas</Label>
        <Input
          type="number"
          name="hincas"
          value={data?.hincas || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Predrilling</Label>
        <Input
          type="number"
          name="predrilling"
          value={data?.predrilling || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Hincas por repartir</Label>
        <Input
          type="number"
          name="hincas_repartir"
          value={data?.hincas_repartir || ""}
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
      Cantidades para Seguridad en Altura
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1.5">
        <Label>Valla Perimetral (m)</Label>
        <Input
          type="number"
          name="valla_perimetral"
          value={data?.valla_perimetral || ""}
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
          value={data?.escaleras_instaladas || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Líneas de Vida (m)</Label>
        <Input
          type="number"
          name="lineas_vida"
          value={data?.lineas_vida || ""}
          onChange={onChange}
          disabled={disabled}
          className="bg-background"
        />
      </div>
    </div>
  </div>
);

const ProjectFormModal = ({
  isOpen,
  onOpenChange,
  projectData,
  onInputChange,
  onSubmit,
  isEditing,
  canManage,
  isLoading,
}) => {
  const handleDetailsInputChange = (e) => {
    const { name, value } = e.target;
    const currentDetails = projectData.detalles_tipo_proyecto || {};
    const newDetails = {
      ...currentDetails,
      [name]: value ? parseFloat(value) : 0,
    };
    onInputChange({
      target: { name: "detalles_tipo_proyecto", value: newDetails },
    });
  };
  const handleProjectTypeToggle = (typeValue) => {
    const currentTypes = Array.isArray(projectData.project_type) ? projectData.project_type : [];
    const newTypes = currentTypes.includes(typeValue)
      ? currentTypes.filter((t) => t !== typeValue)
      : [...currentTypes, typeValue];

    onInputChange({ target: { name: "project_type", value: newTypes } });
    
    if (currentTypes.includes(typeValue)) {
      const fieldsToRemove = PROJECT_TYPE_FIELDS[typeValue] || [];
      const currentDetails = { ...projectData.detalles_tipo_proyecto };
      
      fieldsToRemove.forEach(field => {
        delete currentDetails[field];
      });
      onInputChange({ target: { name: "detalles_tipo_proyecto", value: currentDetails } });
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
        <form onSubmit={onSubmit} className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Proyecto</Label>
            <Input
              id="nombre"
              name="nombre"
              value={projectData.nombre || ""}
              onChange={onInputChange}
              required
              disabled={!canManage}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              name="direccion"
              value={projectData.direccion || ""}
              onChange={onInputChange}
              required
              disabled={!canManage}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={projectData.descripcion || ""}
              onChange={onInputChange}
              disabled={!canManage}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipos de Proyecto (selecciona uno o más)</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {PROJECT_TYPES.map((type) => {
                const isSelected =  Array.isArray(projectData.project_type) && projectData.project_type?.includes(
                  type.value
                );
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleProjectTypeToggle(type.value)}
                    className="transition-all duration-200"
                    disabled={!canManage}
                  >
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {projectData.project_type?.includes("placas_industrial") && (
              <IndustrialForm
                data={projectData.detalles_tipo_proyecto}
                onChange={handleDetailsInputChange}
                disabled={!canManage}
              />
            )}
            {projectData.project_type?.includes("hincado") && (
              <HincadoForm
                data={projectData.detalles_tipo_proyecto}
                onChange={handleDetailsInputChange}
                disabled={!canManage}
              />
            )}
            {projectData.project_type?.includes("seguridad_altura") && (
              <SeguridadForm
                data={projectData.detalles_tipo_proyecto}
                onChange={handleDetailsInputChange}
                disabled={!canManage}
              />
            )}
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
            isUploading={false}
            disabled={!canManage}
          />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            {canManage && (
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Guardar Cambios" : "Crear Proyecto"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormModal;
