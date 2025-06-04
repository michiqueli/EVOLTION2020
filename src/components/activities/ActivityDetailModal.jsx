import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ActivityDetailModal = ({ isOpen, onClose, activity, activityBranches }) => {
  if (!activity) return null;

  const getBranchName = (branchId) => {
    return activityBranches.find(b => b.id === branchId)?.name || 'Desconocido';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Detalles de la Actividad</DialogTitle>
          <DialogDescription>
            {getBranchName(activity.branch)} - {new Date(activity.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-medium">Proyecto</h4>
            <p className="text-sm text-muted-foreground">{activity.proyecto_id}</p>
          </div>

          {activity.comentario_libre && (
            <div>
              <h4 className="font-medium">Comentarios</h4>
              <p className="text-sm text-muted-foreground">{activity.comentario_libre}</p>
            </div>
          )}

          {activity.imagenes && (
            <div>
              <h4 className="font-medium">Imágenes</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {JSON.parse(activity.imagenes).map((img, index) => (
                  <img 
                    key={index}
                    src={img.url}
                    alt={img.name}
                    className="rounded-md object-cover w-full h-32"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;