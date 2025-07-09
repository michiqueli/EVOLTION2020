import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, ClipboardList } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";
import { ActivityFormModal } from "@/components/activities/ActivityFormModal";
import ActivityTable from "@/components/activities/ActivityTable";
import ActivityDetailModal from "@/components/activities/ActivityDetailModal";

const ActivitiesPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingActivity, setEditingActivity] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: projectsData, error: projError } = await supabase
        .from("proyectos")
        .select("id, uuid_id, nombre, project_type, detalles_tipo_proyecto")
        .eq("estado", "En Proceso");
      if (projError) throw projError;
      setProjects(projectsData || []);

      const { data: activitiesData, error: actError } = await supabase
        .from("daily_reports")
        .select("*, proyectos(id, nombre, project_type), creador:user_id(nombre)")
        .order("report_date", { ascending: false });
      if (actError) throw actError;
      setActivities(activitiesData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (location.state?.action === "createReport") {
      handleCreateReport();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateReport = () => {
    setEditingActivity(null); // Nos aseguramos de que no estemos en modo edición
    setIsFormModalOpen(true);
  };

  const handleSubmitReport = async (dataToSave, activityId) => {
    const isEditing = !!activityId;
    try {
      if (isEditing) {
        // El objeto dataToSave ya viene limpio y listo del modal
        const { error } = await supabase
          .from("daily_reports")
          .update(dataToSave)
          .eq("id", activityId);
        if (error) throw error;
        toast({ title: "Informe Actualizado", variant: "success" });
      } else {
        // El objeto dataToSave también viene listo para insertar
        const { error } = await supabase
          .from("daily_reports")
          .insert([dataToSave]);
        if (error) throw error;
        toast({ title: "Informe Creado", variant: "success" });
      }
      await fetchData(); // Refrescamos los datos
    } catch (error) {
      toast({
        title: "Error al Guardar",
        description: error.message,
        variant: "destructive",
      });
      throw error; // Re-lanzamos el error para que el modal sepa que falló y no se cierre
    }
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setIsFormModalOpen(true);
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    try {
      const { error } = await supabase
        .from("daily_reports")
        .delete()
        .eq("id", activityToDelete.id);

      if (error) throw error;

      toast({
        title: "Informe Eliminado",
        description: "El informe ha sido eliminado correctamente.",
        variant: "success",
      });
      fetchData(); // Refrescamos los datos para que desaparezca de la tabla
    } catch (error) {
      toast({
        title: "Error al Eliminar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActivityToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (activity) => {
    setActivityToDelete(activity);
    setIsDeleteDialogOpen(true);
  };

  const handleViewActivity = (activity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-4 md:p-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Informes Diarios</h1>
        <Button
          onClick={handleCreateReport}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" /> Crear Informe
        </Button>
      </div>

      <ActivityFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        projects={projects}
        onSubmit={handleSubmitReport}
        isEditing={!!editingActivity}
        existingActivity={editingActivity}
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : activities.length > 0 ? (
        <ActivityTable
          activities={activities}
          onViewActivity={handleViewActivity}
          onEditActivity={handleEditActivity}
          onDeleteActivity={openDeleteDialog}
        />
      ) : (
        <div className="text-center p-12 border-dashed border rounded-lg">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No hay informes</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea el primer informe para empezar a registrar la actividad.
          </p>
        </div>
      )}

      {selectedActivity && (
        <ActivityDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          activity={selectedActivity}
        />
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN PARA BORRAR */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El informe diario será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActivityToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ActivitiesPage;
