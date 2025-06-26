import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Building,
  FileText,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { getStatusStyles } from "./ProjectCard";
import { cn } from "@/lib/utils";

const ProjectDetailView = ({ isOpen, onOpenChange, project }) => {
  if (!project) return null;

  const documentationArray = project.documentacion
    ? JSON.parse(project.documentacion)
    : [];
  const statusStyle = getStatusStyles(project.estado);


  const googleMapsUrl = project.direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        project.direccion
      )}`
    : null;

  const googleMapsEmbedUrl = project.direccion
    ? `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(
        project.direccion
      )}&key=${import.meta.env.VITE_MAPS_API_KEY}`
    : null;

  const getFileIcon = (fileName) => {
    if (fileName.endsWith(".pdf"))
      return <FileText className="h-5 w-5 text-red-500" />;
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx"))
      return <FileText className="h-5 w-5 text-blue-500" />;
    if (
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpeg")
    )
      return <Paperclip className="h-5 w-5 text-green-500" />;
    return <Paperclip className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-background border-border max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-primary flex items-center">
              {project.nombre}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Detalles completos del proyecto.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 bg-card rounded-lg border">
              <h3 className="text-xl font-semibold text-foreground flex items-center">
                <Building className="h-5 w-5 mr-2 text-primary" />
                Estado del Proyecto
              </h3>
              <div
                className={cn(
                  "text-lg font-medium px-3 py-1.5 rounded-md inline-flex items-center",
                  statusStyle.color
                )}
              >
                {React.cloneElement(statusStyle.icon, {
                  className: "h-4 w-4 mr-2",
                })}
                {statusStyle.label}
              </div>

              <h3 className="text-xl font-semibold text-foreground flex items-center">
                <Building className="h-5 w-5 mr-2 text-primary" />
                Horas Totales de Trabajo
              </h3>
              <div className="text-lg font-medium px-3 py-1.5 rounded-md inline-flex items-center">
                {project.horas.toFixed(1)} HS
              </div>
            </div>
          </div>

          {project.direccion && (
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-xl font-semibold text-foreground flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                Ubicación
              </h3>
              <p className="text-muted-foreground mb-2">{project.direccion}</p>

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  Abrir en Google Maps <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              )}
            </div>
          )}

          <div className="p-4 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold text-foreground">
              Descripción del Proyecto
            </h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {project.descripcion || "No hay descripción detallada."}
            </p>
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold text-foreground flex items-center">
              <Paperclip className="h-5 w-5 mr-2 text-primary" />
              Archivos Adjuntos
            </h3>

            {documentationArray && documentationArray.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {documentationArray.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md border"
                  >
                    <div className="flex items-center">
                      {getFileIcon(file.name)}
                      <span className="ml-2 text-sm text-foreground">
                        {file.name}
                      </span>
                    </div>

                    <a
                      href={file.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:underline"
                      >
                        Descargar
                      </Button>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                No hay archivos adjuntos para este proyecto.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-border sticky bottom-0 bg-background/80 backdrop-blur-sm">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailView;