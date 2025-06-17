import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useUser, ROLES } from "@/contexts/UserContext";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectFormModal from "@/components/projects/ProjectFormModal";
import ProjectDetailView from "@/components/projects/ProjectDetailView";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

const initialNewProjectState = {
  id: null,
  nombre: "",
  direccion: "",
  descripcion: "",
  documentacion: "",
  observaciones: "",
  estado: "Por Iniciar",
  horas: 0,
};

const ProjectsPage = () => {
  const { user } = useUser();
  const [projects, setProjects] = useState([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [currentProjectData, setCurrentProjectData] = useState(
    initialNewProjectState
  );
  const [statusFilter, setStatusFilter] = useState("activos");
  const { toast } = useToast();

  const { proyectosActivos, proyectosNoActivos } = useMemo(() => {
    const statusOrder = {
      "En Proceso": 1,
      Pausado: 2,
      "Por Iniciar": 3,
    };

    const activos = projects
      .filter((p) =>
        ["Por Iniciar", "En Proceso", "Pausado"].includes(p.estado)
      )
      .sort((a, b) => statusOrder[a.estado] - statusOrder[b.estado]);

    const noActivos = projects.filter((p) =>
      ["Finalizada", "Cancelado"].includes(p.estado)
    );

    return { proyectosActivos: activos, proyectosNoActivos: noActivos };
  }, [projects]);

  const canManageProjects =
    user &&
    (user.rol === ROLES.CEO ||
      user.rol === ROLES.ADMIN ||
      user.rol === ROLES.SUPERVISOR ||
      user.rol === ROLES.DEVELOPER);
  const isTechnician = user && user.rol === ROLES.WORKER;

  const fetchProjects = useCallback(
    async (filter) => {
      try {
        let query = supabase
          .from("proyectos")
          .select("*")
          .order("created_at", { ascending: false });

        // Aplicamos el filtro en la base de datos para más eficiencia
        if (filter === "activos") {
          // El operador 'in' busca estados que estén en la lista proporcionada.
          query = query.in("estado", ["Por Iniciar", "En Proceso", "Pausado"]);
        } else if (filter && filter !== "todos") {
          // Si es un estado específico (ej. 'Finalizada'), usamos 'eq'.
          query = query.eq("estado", filter);
        }
        // Si el filtro es 'todos', no aplicamos ningún filtro de estado.

        const { data, error } = await query;
        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error al cargar proyectos",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchProjects(statusFilter);
  }, [statusFilter, fetchProjects]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProjectData((prev) => ({ ...prev, [name]: value }));
  };

  const resetFormAndStates = () => {
    setCurrentProjectData(initialNewProjectState);
    setEditingProject(null);
    setViewingProject(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageProjects) {
      toast({ title: "Acción no permitida", variant: "destructive" });
      return;
    }

    try {
      if (editingProject) {
        const { error } = await supabase
          .from("proyectos")
          .update({
            nombre: currentProjectData.nombre,
            direccion: currentProjectData.direccion,
            descripcion: currentProjectData.descripcion,
            documentacion: currentProjectData.documentacion,
            observaciones: currentProjectData.observaciones,
            estado: currentProjectData.estado,
          })
          .eq("id", editingProject.id);

        if (error) throw error;
        toast({
          title: "Proyecto Actualizado",
          description: `El proyecto "${currentProjectData.nombre}" ha sido modificado.`,
        });
      } else {
        const { error } = await supabase.from("proyectos").insert([
          {
            nombre: currentProjectData.nombre,
            direccion: currentProjectData.direccion,
            descripcion: currentProjectData.descripcion,
            documentacion: currentProjectData.documentacion,
            observaciones: currentProjectData.observaciones,
            estado: "Por Iniciar",
            horas: 0,
          },
        ]);

        if (error) throw error;
        toast({
          title: "Proyecto Creado",
          description: `El proyecto "${currentProjectData.nombre}" ha sido añadido.`,
        });
      }

      await fetchProjects();
      resetFormAndStates();
      setIsFormModalOpen(false);
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error al guardar el proyecto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (projectId, newStatus) => {
    if (!canManageProjects) {
      toast({ title: "Acción no permitida", variant: "destructive" });
      return;
    }

    try {
      // Primero, verificamos que el proyecto exista y obtenemos sus datos actuales
      const { data: existingProject, error: fetchError } = await supabase
        .from("proyectos")
        .select("*")
        .eq("id", projectId)
        .single();

      if (fetchError) throw fetchError;

      if (!existingProject) {
        throw new Error("Proyecto no encontrado");
      }

      // Realizamos la actualización
      const { error: updateError } = await supabase
        .from("proyectos")
        .update({
          estado: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (updateError) throw updateError;

      // Verificamos que la actualización fue exitosa
      const { data: updatedProject, error: verifyError } = await supabase
        .from("proyectos")
        .select("estado")
        .eq("id", projectId)
        .single();

      if (verifyError) throw verifyError;

      if (updatedProject.estado !== newStatus) {
        throw new Error(
          "La actualización del estado no se completó correctamente"
        );
      }

      await fetchProjects(statusFilter);
      toast({
        title: "Estado Actualizado",
        description: `El proyecto ahora está "${newStatus}".`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating project status:", error);
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditProject = (project) => {
    if (!canManageProjects) {
      toast({ title: "Acción no permitida", variant: "destructive" });
      return;
    }
    setEditingProject(project);
    setCurrentProjectData({ ...project });
    setIsDetailViewOpen(false);
    setIsFormModalOpen(true);
  };

  const handleViewDetails = (project) => {
    setViewingProject(project);
    setCurrentProjectData({ ...project });
    setIsFormModalOpen(false);
    setIsDetailViewOpen(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (!canManageProjects) {
      toast({ title: "Acción no permitida", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("proyectos")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      await fetchProjects();
      toast({
        title: "Proyecto Eliminado",
        description: "El proyecto ha sido eliminado correctamente.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error al eliminar el proyecto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openNewProjectModal = () => {
    if (!canManageProjects) {
      toast({ title: "Acción no permitida", variant: "destructive" });
      return;
    }
    resetFormAndStates();
    setIsDetailViewOpen(false);
    setIsFormModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 p-1 md:p-4 lg:p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">Proyectos</h1>

        {/* --- PASO 2: AÑADIR EL DROPDOWN DE FILTRO --- */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[250px] bg-card border-input">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por estado..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activos">Proyectos Activos</SelectItem>
            <SelectItem value="todos">Todos los Proyectos</SelectItem>
            <SelectItem value="Por Iniciar">Por Iniciar</SelectItem>
            <SelectItem value="En Proceso">En Proceso</SelectItem>
            <SelectItem value="Pausado">Pausado</SelectItem>
            <SelectItem value="Finalizada">Finalizado</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        {canManageProjects && (
          <Button
            onClick={openNewProjectModal}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-lg flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Nuevo Proyecto
          </Button>
        )}
      </div>

      <ProjectFormModal
        isOpen={isFormModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) resetFormAndStates();
          setIsFormModalOpen(isOpen);
        }}
        projectData={currentProjectData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        isEditing={!!editingProject}
        canManage={canManageProjects}
      />

      <ProjectDetailView
        isOpen={isDetailViewOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) resetFormAndStates();
          setIsDetailViewOpen(isOpen);
        }}
        project={viewingProject}
      />

      <>
        {/* --- SECCIÓN DE PROYECTOS ACTIVOS --- */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Proyectos Activos
          </h2>
          {proyectosActivos.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              layout
            >
              {proyectosActivos.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onUpdateStatus={handleUpdateStatus}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  onViewDetails={handleViewDetails}
                  // No pasamos prop de inactivo aquí
                />
              ))}
            </motion.div>
          ) : (
            <p className="text-muted-foreground italic">
              No hay proyectos activos o el filtro seleccionado los esta
              ocultando
            </p>
          )}
        </section>

        {/* --- SECCIÓN DE PROYECTOS NO ACTIVOS --- */}
        {proyectosNoActivos.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Proyectos NO Activos
            </h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              layout
            >
              {proyectosNoActivos.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onUpdateStatus={handleUpdateStatus}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  onViewDetails={handleViewDetails}
                  isInactivo={true}
                />
              ))}
            </motion.div>
          </section>
        )}

        {/* Mensaje de "No hay proyectos" si ambas listas están vacías */}
        {projects.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-12 text-center mt-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              No hay proyectos aún
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {canManageProjects
                ? "Crea tu primer proyecto para empezar a organizarte."
                : isTechnician
                ? "No tienes proyectos asignados."
                : "No hay proyectos creados."}
            </p>
          </div>
        )}
      </>
    </motion.div>
  );
};

export default ProjectsPage;
