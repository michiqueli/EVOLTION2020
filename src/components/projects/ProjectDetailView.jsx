import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, CalendarDays, Users, Truck, FileText, Paperclip, ExternalLink, Building } from 'lucide-react';
import { getStatusStyles } from './ProjectCard'; 
import { cn } from '@/lib/utils';

const ProjectDetailView = ({ isOpen, onOpenChange, project }) => {
  if (!project) return null;

  const statusStyle = getStatusStyles(project.status);

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg')) return <Paperclip className="h-5 w-5 text-green-500" />; // Using Paperclip for images
    return <Paperclip className="h-5 w-5 text-gray-500" />;
  };
  
  const mapUrl = project.address 
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(project.address)}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-background border-border max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-primary flex items-center">
              {project.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Detalles completos del proyecto.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 bg-card rounded-lg border">
              <h3 className="text-xl font-semibold text-foreground flex items-center"><Building className="h-5 w-5 mr-2 text-primary" />Cliente e Información General</h3>
              <p className="text-muted-foreground"><strong className="text-foreground">Cliente:</strong> {project.client || 'No especificado'}</p>
              <div className={cn("text-sm font-medium px-3 py-1.5 rounded-md inline-flex items-center", statusStyle.color)}>
                {React.cloneElement(statusStyle.icon, { className: "h-4 w-4 mr-2"})}
                {statusStyle.label}
              </div>
            </div>

            <div className="space-y-4 p-4 bg-card rounded-lg border">
              <h3 className="text-xl font-semibold text-foreground flex items-center"><CalendarDays className="h-5 w-5 mr-2 text-primary" />Fechas y Equipo</h3>
              <p className="text-muted-foreground"><strong className="text-foreground">Inicio:</strong> {project.startDate || 'No especificado'}</p>
              <p className="text-muted-foreground"><strong className="text-foreground">Fin:</strong> {project.endDate || 'No especificado'}</p>
              {project.technicians && <p className="text-muted-foreground flex items-center"><Users className="h-4 w-4 mr-2 text-primary/80" /> <strong className="text-foreground">Técnicos:</strong> {project.technicians}</p>}
              {project.vehicle && <p className="text-muted-foreground flex items-center"><Truck className="h-4 w-4 mr-2 text-primary/80" /> <strong className="text-foreground">Vehículo:</strong> {project.vehicle}</p>}
            </div>
          </div>
          
          {project.address && (
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-xl font-semibold text-foreground flex items-center"><MapPin className="h-5 w-5 mr-2 text-primary" />Ubicación</h3>
              <p className="text-muted-foreground mb-2">{project.address}</p>
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-primary hover:underline">
                  Ver en OpenStreetMap <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              )}
              <div className="mt-3 h-48 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground border">
                (Vista previa del mapa aquí - conceptual)
                <img  alt="Mapa de ubicación del proyecto" className="w-full h-full object-cover rounded-md opacity-50" src="https://images.unsplash.com/photo-1469288205312-804b99a8d717" />
              </div>
            </div>
          )}

          <div className="p-4 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold text-foreground">Descripción del Proyecto</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{project.description || 'No hay descripción detallada.'}</p>
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold text-foreground flex items-center"><Paperclip className="h-5 w-5 mr-2 text-primary" />Archivos Adjuntos</h3>
            {project.files && project.files.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {project.files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border">
                    <div className="flex items-center">
                      {getFileIcon(file.name)}
                      <span className="ml-2 text-sm text-foreground">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:underline">
                      Descargar
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No hay archivos adjuntos para este proyecto.</p>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-border sticky bottom-0 bg-background/80 backdrop-blur-sm">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailView;