import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileText, Search } from 'lucide-react';
import ProjectTrackingCard from '@/components/tracking/ProjectTrackingCard'; // Reut

const TrackingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        // Obtenemos todos los proyectos para que el usuario pueda elegir
        const { data, error } = await supabase
          .from('proyectos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error al cargar proyectos",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [toast]);

  // Reutilizamos la misma lógica para agrupar y ordenar que en ProjectsPage
  const { proyectosActivos, proyectosNoActivos } = useMemo(() => {
    const statusOrder = { "En Proceso": 1, "Pausado": 2, "Por Iniciar": 3 };
    const activos = projects
      .filter(p => ['Por Iniciar', 'En Proceso', 'Pausado'].includes(p.estado))
      .sort((a, b) => statusOrder[a.estado] - statusOrder[b.estado]);
    const noActivos = projects
      .filter(p => ['Finalizada', 'Cancelado'].includes(p.estado));
    return { proyectosActivos: activos, proyectosNoActivos: noActivos };
  }, [projects]);

  // Esta es la función que se ejecutará al hacer clic en una tarjeta
  const handleSelectProject = (project) => {
    // Usamos el uuid_id para la URL, que es único
    navigate(`/tracking/${project.uuid_id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-4 md:p-6"
    >
      <div className="flex items-center gap-4">
        <Search className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Seleccionar Proyecto para Ver los avances</h1>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center mt-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No hay proyectos para mostrar</h3>
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4 border-b pb-2">Proyectos Activos</h2>
            {proyectosActivos.length > 0 ? (
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" layout>
                {proyectosActivos.map(project => (
                  <ProjectTrackingCard 
                    key={project.id} 
                    project={project} 
                    onViewDetails={handleSelectProject}
                    onUpdateStatus={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </motion.div>
            ) : (
              <p className="text-muted-foreground italic mt-4">No hay proyectos activos.</p>
            )}
          </section>

          {proyectosNoActivos.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4 border-b pb-2">Proyectos no Activos</h2>
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" layout>
                {proyectosNoActivos.map(project => (
                  <ProjectTrackingCard 
                    key={project.id} 
                    project={project}
                    isInactivo={true}
                    onViewDetails={handleSelectProject}
                    onUpdateStatus={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </motion.div>
            </section>
          )}
        </>
      )}
    </motion.div>
  );
};
export default TrackingPage;