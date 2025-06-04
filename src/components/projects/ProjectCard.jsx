
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarDays, Loader, CheckCircle, MoreVertical, Edit2, Trash2, Info, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, ROLES } from '@/contexts/UserContext';

export const projectStatusOptions = [
  { value: 'Por Iniciar', label: 'Por Iniciar', icon: <CalendarDays className="h-4 w-4 mr-2" />, color: 'bg-blue-500/20 text-blue-700 border-blue-500' },
  { value: 'En Proceso', label: 'En Proceso', icon: <Loader className="h-4 w-4 mr-2 animate-spin" />, color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500' },
  { value: 'Finalizada', label: 'Finalizada', icon: <CheckCircle className="h-4 w-4 mr-2" />, color: 'bg-green-500/20 text-green-700 border-green-500' }
];

export const getStatusStyles = (statusValue) => {
  return projectStatusOptions.find(s => s.value === statusValue) || projectStatusOptions[0];
};

const ProjectCard = ({ project, onUpdateStatus, onEdit, onDelete, onViewDetails }) => {
  const { user } = useUser();
  const statusStyle = getStatusStyles(project.estado);

  const canManage = user && (user.role === ROLES.CEO || user.role === ROLES.ADMIN || user.role === ROLES.SUPERVISOR);
  const isTechnician = user && user.role === ROLES.WORKER;

  const handleCardClick = () => {
    if (isTechnician) {
      onViewDetails(project);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "bg-card p-4 rounded-xl shadow-lg border relative overflow-hidden",
        statusStyle.color.split(' ')[2],
        isTechnician ? "cursor-pointer hover:shadow-primary/30" : ""
      )}
      onClick={isTechnician ? handleCardClick : undefined}
    >
      <div className={cn("absolute top-0 left-0 h-full w-1.5", statusStyle.color.split(' ')[0])}></div>
      <div className="pl-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-primary pr-8">{project.nombre}</h3>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 absolute top-2 right-2">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border shadow-xl">
                <DropdownMenuLabel>Estado del Proyecto</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projectStatusOptions.map(statusOpt => (
                  <DropdownMenuItem key={statusOpt.value} onClick={(e) => { e.stopPropagation(); onUpdateStatus(project.id, statusOpt.value);}} disabled={project.estado === statusOpt.value}>
                    {React.cloneElement(statusOpt.icon, { className: cn(statusOpt.icon.props.className, statusOpt.color.split(' ')[1]) })}
                    <span>{statusOpt.label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Proyecto
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(project); }}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isTechnician && (
             <Button variant="ghost" size="icon" className="h-7 w-7 absolute top-2 right-2" onClick={(e) => { e.stopPropagation(); onViewDetails(project); }}>
                <Eye className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground"><span className="font-medium">Dirección:</span> {project.direccion}</p>
        <div className={cn("mt-3 text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center", statusStyle.color)}>
          {React.cloneElement(statusStyle.icon, { className: "h-3 w-3 mr-1"})}
          {statusStyle.label}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;