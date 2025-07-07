import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays,
  Loader,
  CheckCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  XCircle,
  PauseCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUser, ROLES } from "@/contexts/UserContext";

// --- PASO 1: MEJORAMOS LA ESTRUCTURA DE DATOS PARA LOS ESTILOS ---
// Ahora cada estilo tiene su propia propiedad. ¡Mucho más claro y seguro!
export const projectStatusOptions = [
  {
    value: "Por Iniciar",
    label: "Por Iniciar",
    icon: <CalendarDays />,
    badgeClasses:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    borderClasses: "border-blue-500",
    leftBarClasses: "bg-blue-500",
    iconColor: "text-blue-500",
  },
  {
    value: "En Proceso",
    label: "En Proceso",
    icon: <Loader className="animate-spin" />,
    badgeClasses:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    borderClasses: "border-green-500",
    leftBarClasses: "bg-green-500",
    iconColor: "text-green-500",
  },
  {
    value: "Pausado",
    label: "Pausado",
    icon: <PauseCircle />,
    badgeClasses:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    borderClasses: "border-yellow-500",
    leftBarClasses: "bg-yellow-500",
    iconColor: "text-yellow-500",
  },
  {
    value: "Finalizada",
    label: "Finalizada",
    icon: <CheckCircle />,
    badgeClasses:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300",
    borderClasses: "border-violet-500",
    leftBarClasses: "bg-violet-500",
    iconColor: "text-violet-500",
  },
  {
    value: "Cancelado",
    label: "Cancelado",
    icon: <XCircle />,
    badgeClasses:
      "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    borderClasses: "border-red-500",
    leftBarClasses: "bg-red-500",
    iconColor: "text-red-500",
  },
];
export const getStatusStyles = (statusValue) => {
  return (
    projectStatusOptions.find((s) => s.value === statusValue) ||
    projectStatusOptions[0]
  );
};

const ProjectTrackingCard = ({
  project,
  onUpdateStatus,
  onEdit,
  onDelete,
  onViewDetails,
  isInactivo = false,
}) => {
  const { user } = useUser();
  const statusStyle = getStatusStyles(project.estado);

  const canManage =
    user &&
    (user.rol === ROLES.CEO ||
      user.rol === ROLES.ADMIN ||
      user.rol === ROLES.SUPERVISOR ||
      user.rol === ROLES.DEVELOPER);
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{
              scale: 1.04,
              opacity: 1,
              filter: "grayscale(0)",
            }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={cn(
              "bg-card p-4 rounded-xl shadow-lg border relative overflow-hidden cursor-pointer",
              "transition-shadow duration-300",
              "hover:shadow-xl hover:shadow-lime-600",
              statusStyle.borderClasses,
              isInactivo && "opacity-60 grayscale"
            )}
            onClick={() => onViewDetails(project)}
          >
            <div
              className={cn(
                "absolute top-0 left-0 h-full w-1.5",
                statusStyle.leftBarClasses
              )}
            ></div>

            <div className="pl-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-primary pr-8">
                  {project.nombre}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Dirección:</span>{" "}
                {project.direccion}
              </p>
              <div
                className={cn(
                  "mt-3 text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center",
                  statusStyle.badgeClasses
                )}
              >
                {React.cloneElement(statusStyle.icon, {
                  className: "h-3.5 w-3.5 mr-1.5",
                })}
                {statusStyle.label}
              </div>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-primary text-primary-foreground"
        >
          <p>Haz clic para ver los detalles del proyecto</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ProjectTrackingCard;
