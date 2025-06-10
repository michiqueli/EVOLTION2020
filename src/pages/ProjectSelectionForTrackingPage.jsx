import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Loader2, FileText, Eye, TrendingUp } from 'lucide-react';
import ProjectCard from '@/components/projects/ProjectCard'; // Re-using ProjectCard

const projectStates = ["Planificado", "En Curso", "Pausado", "Completado", "Cancelado", "Todos"];

const ProjectSelectionForTrackingPage = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error("Error fetching projects:", error);
      toast({ title: "Error", description: "No se pudieron cargar los proyectos.", variant: "destructive" });
      setProjects([]);
    } else {
      setProjects(data || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    let result = projects;
    if (searchTerm) {
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.cliente && p.cliente.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter !== 'all' && statusFilter !== 'Todos') {
      result = result.filter(p => p.estado === statusFilter);
    }
    setFilteredProjects(result);
  }, [projects, searchTerm, statusFilter]);

  const handleSelectProjectForTracking = (projectId) => {
    navigate(`/tracking/${projectId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 p-1"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Seleccionar Proyecto para Seguimiento</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre o cliente..."
              className="pl-10 w-full sm:w-64 bg-card border-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card border-input">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground inline-block" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              {projectStates.map(state => (
                <SelectItem key={state} value={state.toLowerCase() === 'todos' ? 'all' : state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : filteredProjects.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          <AnimatePresence>
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.uuid_id}
                project={project}
                onSelectForTracking={handleSelectProjectForTracking}
                isSelectionMode={true}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center mt-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold text-foreground">
            {projects.length > 0 && searchTerm ? 'No hay proyectos que coincidan con tu búsqueda.' : 'No hay proyectos para mostrar.'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {projects.length > 0 && searchTerm ? 'Intenta con otros términos de búsqueda o ajusta los filtros.' : 'Aún no se han creado proyectos o no coinciden con los filtros.'}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ProjectSelectionForTrackingPage;