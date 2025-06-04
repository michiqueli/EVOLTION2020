
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreVertical, Eye, Edit2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/supabaseClient';

const ActivityTable = ({ 
  activities, 
  selectedBranch,
  onBranchChange,
  onViewActivity,
  onEditActivity,
  onDeleteActivity,
  activityBranches 
}) => {
  const [projectNames, setProjectNames] = useState({});

  useEffect(() => {
    const fetchProjectNames = async () => {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre');
      
      if (!error && data) {
        const namesMap = {};
        data.forEach(project => {
          namesMap[project.id] = project.nombre;
        });
        setProjectNames(namesMap);
      }
    };

    fetchProjectNames();
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={selectedBranch} onValueChange={onBranchChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {activityBranches.map(branch => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="py-3 px-4 text-left font-medium">Fecha</th>
                <th className="py-3 px-4 text-left font-medium">Tipo</th>
                <th className="py-3 px-4 text-left font-medium">Proyecto</th>
                <th className="py-3 px-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <motion.tr 
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-t border-border hover:bg-muted/50"
                >
                  <td className="py-3 px-4">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {activityBranches.find(b => b.id === activity.branch)?.name || 'Desconocido'}
                  </td>
                  <td className="py-3 px-4">
                    {projectNames[activity.proyecto_id] || 'Proyecto no encontrado'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewActivity(activity)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditActivity(activity)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteActivity(activity.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
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