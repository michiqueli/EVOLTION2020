import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge"; // Usaremos Badge para los tipos

const ActivityTable = ({
  activities,
  onViewActivity,
  onEditActivity,
  onDeleteActivity,
}) => {
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Fecha del Informe
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Proyecto
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Tipos de Actividad
                </th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <motion.tr
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-t hover:bg-muted/50"
                >
                  <td className="py-3 px-4">
                    {/* Usamos report_date que es la fecha del trabajo */}
                    {new Date(
                      activity.report_date + "T00:00:00"
                    ).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    {/* Leemos el nombre del proyecto directamente del objeto anidado */}
                    {activity.proyectos?.nombre || "Proyecto no encontrado"}
                  </td>
                  <td className="py-3 px-4">
                    {/* Mostramos los tipos de proyecto como Badges */}
                    <div className="flex flex-wrap gap-1">
                      {(activity.proyectos?.project_type || []).map((type) => (
                        <Badge
                          key={type}
                          variant="secondary"
                          className="capitalize"
                        >
                          {type.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onViewActivity(activity)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditActivity(activity)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteActivity(activity)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityTable;
