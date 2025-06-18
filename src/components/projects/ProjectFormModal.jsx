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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import FileUploadSection from "@/components/activities/FileUploadSection";

const PROJECT_TYPES = [
  { value: "placas_domesticas", label: "Placas Solares Domésticas" },
  { value: "placas_industrial", label: "Placas Soalres Industrial" },
  { value: "hincado", label: "Hincado" },
  { value: "seguridad_altura", label: "Seguridad en Altura" },
  { value: "otro", label: "Otro" },
];

const ProjectFormModal = ({
  isOpen,
  onOpenChange,
  projectData,
  onInputChange,
  onSubmit,
  isEditing,
  canManage,
  projectType,
  onProjectTypeChange,
  isLoading,
}) => {
  const handleDetailsInputChange = (e) => {
    const { name, value } = e.target;
    const newDetails = {
      ...projectData.detalles_tipo_proyecto,
      [name]: value ? parseFloat(value) : 0,
    };
    onInputChange({
      target: {
        name: "detalles_tipo_proyecto",
        value: newDetails,
      },
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (canManage) {
      onSubmit(e, projectType);
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
          {/* --- AQUÍ EMPIEZA LA NUEVA SECCIÓN DE SOLAPAS --- */}
          <div className="space-y-2">
            <Label>Tipo de Proyecto</Label>
            <Tabs
              value={projectType}
              onValueChange={onProjectTypeChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5 h-auto">
                {PROJECT_TYPES.map((type) => (
                  <TabsTrigger
                    key={type.value}
                    value={type.value}
                    className="text-xs sm:text-sm h-auto py-2 whitespace-normal"
                  >
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Contenido para cada solapa (por ahora con placeholders) */}
              <TabsContent value="placas_industrial">
                <div className="p-4 border rounded-md bg-card mt-2 space-y-4">
                  <h4 className="font-medium text-center text-muted-foreground">
                    Cantidades Totales del Proyecto
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Placas por Instalar</Label>
                      <Input
                        type="number"
                        name="placas_a_instalar"
                        value={
                          projectData.detalles_tipo_proyecto
                            ?.placas_a_instalar || ""
                        }
                        onChange={handleDetailsInputChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Estructura por Instalar</Label>
                      <Input
                        type="number"
                        name="estructura_a_instalar"
                        value={
                          projectData.detalles_tipo_proyecto
                            ?.estructura_a_instalar || ""
                        }
                        onChange={handleDetailsInputChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Metros de Cable</Label>
                      <Input
                        type="number"
                        name="metros_cable"
                        value={
                          projectData.detalles_tipo_proyecto?.metros_cable || ""
                        }
                        onChange={handleDetailsInputChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Metros de Canalización</Label>
                      <Input
                        type="number"
                        name="metros_canalizacion"
                        value={
                          projectData.detalles_tipo_proyecto
                            ?.metros_canalizacion || ""
                        }
                        onChange={handleDetailsInputChange}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="otro">
                <div className="p-4 border rounded-md bg-card mt-2">
                  <p className="text-center text-muted-foreground italic">
                    Este tipo de proyecto no requiere detalles de cantidad
                    adicionales.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="placas_domesticas">
                <div className="p-4 border rounded-md bg-card mt-2">
                  <p className="text-center text-muted-foreground italic">
                    Este tipo de proyecto no requiere detalles de cantidad
                    adicionales.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="hincado">
                <div className="p-4 border rounded-md bg-card mt-2 space-y-4">
                  <h4 className="font-medium text-center text-muted-foreground">
                    Cantidades Totales del Proyecto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Hincas</Label>
                      <Input
                        type="number"
                        name="hincas"
                        value={projectData.detalles_tipo_proyecto?.hincas || ""}
                        onChange={handleDetailsInputChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Predrilling</Label>
                      <Input
                        type="number"
                        name="predrilling"
                        value={
                          projectData.detalles_tipo_proyecto?.predrilling || ""
                        }
                        onChange={handleDetailsInputChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Hincas por repartir</Label>
                      <Input
                        type="number"
                        name="hincas_repartir"
                        value={
                          projectData.detalles_tipo_proyecto?.hincas_repartir ||
                          ""
                        }
                        onChange={handleDetailsInputChange}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seguridad_altura">
                <div className="p-4 border rounded-md bg-card mt-2 space-y-4">
                  <h4 className="font-medium text-center text-muted-foreground">
                    Cantidades Totales del Proyecto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Valla Perimetral (m)</Label>
                      <Input
                        type="number"
                        name="valla_perimetral"
                        value={
                          projectData.detalles_tipo_proyecto
                            ?.valla_perimetral || ""
                        }
                        onChange={handleDetailsInputChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Escaleras Instaladas</Label>
                      <Input
                        type="number"
                        name="escaleras_instaladas"
                        value={
                          projectData.detalles_tipo_proyecto
                            ?.escaleras_instaladas || ""
                        }
                        onChange={handleDetailsInputChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Líneas de Vida (m)</Label>
                      <Input
                        type="number"
                        name="lineas_vida"
                        value={
                          projectData.detalles_tipo_proyecto?.lineas_vida || ""
                        }
                        onChange={handleDetailsInputChange}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          {/* --- FIN DE LA SECCIÓN DE SOLAPAS --- */}

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
