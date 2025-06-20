import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  ClipboardList,
  Sun,
  Home,
  ShieldAlert,
  Hammer,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ActivityBranchSelector from "@/components/activities/ActivityBranchSelector";
import ActivityForm from "@/components/activities/ActivityForm";
import ActivityTable from "@/components/activities/ActivityTable";
import ActivityDetailModal from "@/components/activities/ActivityDetailModal";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";

const activityBranchesData = [
  {
    id: "solarIndustry",
    name: "Placas solares - Industria",
    icon: Sun,
    tableName: "placas_solares_industria",
  },
  {
    id: "solarDomestic",
    name: "Placas solares - Doméstica",
    icon: Home,
    tableName: "placas_solares_domestica",
  },
  {
    id: "heightSafety",
    name: "Seguridad en altura",
    icon: ShieldAlert,
    tableName: "seguridad_en_altura",
  },
  { id: "piling", name: "Hincado", icon: Hammer, tableName: "hincado" },
];

const ActivitiesPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [activities, setActivities] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filePreviews, setFilePreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("proyectos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAvailableProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error al cargar proyectos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchActivities = useCallback(async () => {
    // --- CAMBIO 2: Ahora esta función controla el estado de carga ---
    setIsLoading(true);
    try {
      let allActivities = [];
      const branchesToFetch =
        filterBranch === "all"
          ? activityBranchesData
          : activityBranchesData.filter((b) => b.id === filterBranch);

      for (const branch of branchesToFetch) {
        const { data, error } = await supabase
          .from(branch.tableName)
          .select("*")
          .order("created_at", { ascending: false });
        if (error) {
          // Si una tabla no existe, en lugar de romper todo, solo lo notificamos en consola
          console.warn(
            `Could not fetch from table ${branch.tableName}:`,
            error.message
          );
          continue; // y seguimos con la siguiente
        }
        const formattedData = (data || []).map((item) => ({
          ...item,
          branch: branch.id,
          branchName: branch.name,
        }));
        allActivities = [...allActivities, ...formattedData];
      }
      setActivities(allActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast({
        title: "Error al cargar actividades",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      // Solo cuando todo termina, la carga finaliza.
      setIsLoading(false);
    }
  }, [toast, filterBranch]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, proyecto_id: value }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      status: "pending",
    }));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (fileName) => {
    setFilePreviews((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleBranchSelect = (branchId) => {
    setSelectedBranch(branchId);
    setShowBranchSelector(false);
    setShowForm(true);
  };

  const handleCreateNewReport = () => {
    setSelectedActivity(null);
    setSelectedBranch(null);
    setFormData({});
    setFilePreviews([]);
    setShowBranchSelector(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const branch = activityBranchesData.find((b) => b.id === selectedBranch);
      if (!branch) throw new Error("Tipo de actividad no válido");

      // Preparar los datos según la tabla correspondiente
      const activityData = {
        ...formData,
        proyecto_id: formData.proyecto_id,
        comentario_libre: formData.comentario_libre || "",
        created_at: new Date().toISOString(),
      };

      // Subir archivos si existen
      if (filePreviews.length > 0) {
        const uploadedUrls = await Promise.all(
          filePreviews.map(async (preview) => {
            const fileExt = preview.file.name.split(".").pop();
            const fileName = `${Math.random()
              .toString(36)
              .substring(2)}.${fileExt}`;

            const { data, error } = await supabase.storage
              .from("almacenamientoinformes")
              .upload(fileName, preview.file);

            if (error) throw error;

            const {
              data: { publicUrl },
            } = supabase.storage
              .from("almacenamientoinformes")
              .getPublicUrl(fileName);

            return {
              url: publicUrl,
              name: preview.file.name, // opcional, podés agregar más campos si querés
            };
          })
        );

        // Agregar las URLs de las imágenes al objeto de datos
        activityData.imagenes = JSON.stringify(uploadedUrls);
      }

      const { error } = await supabase
        .from(branch.tableName)
        .upsert([activityData], {
          onConflict: "id",
        });
      if (error) throw error;

      await fetchActivities();
      setShowForm(false);
      setSelectedActivity(null);
      setSelectedBranch(null);
      setFormData({});
      setFilePreviews([]);
      toast({
        title: "Actividad guardada",
        description: "La actividad se ha guardado correctamente",
      });
    } catch (error) {
      console.error("Error saving activity:", error);
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      const branch = activityBranchesData.find((b) => b.id === activity.branch);
      if (!branch) return;

      const { error } = await supabase
        .from(branch.tableName)
        .delete()
        .eq("id", activityId);

      if (error) throw error;

      await fetchActivities();
      toast({
        title: "Actividad eliminada",
        description: "La actividad ha sido eliminada correctamente",
      });
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewActivity = (activity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setSelectedBranch(activity.branch);
    setFormData(activity);
    setShowForm(true);
  };

  const handleBranchFilter = (branch) => {
    setFilterBranch(branch);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 p-1 md:p-4 lg:p-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">
          Informe Diario de Actividades
        </h1>
        <Button
          onClick={handleCreateNewReport}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Crear Nuevo Informe
        </Button>
      </div>

      {/* La lógica de renderizado ahora se muestra aquí */}

      {isLoading ? (
        // 1. Si está cargando, muestra el spinner.
        <div className="flex justify-center items-center h-64 text-muted-foreground text-lg">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : showForm || showBranchSelector ? (
        // 2. Si no está cargando PERO se está mostrando un formulario, muestra el formulario correspondiente.
        showBranchSelector ? (
          <ActivityBranchSelector
            branches={activityBranchesData}
            onSelect={handleBranchSelect}
            onCancel={() => setShowBranchSelector(false)}
          />
        ) : (
          <ActivityForm
            selectedBranch={selectedBranch}
            activityBranches={activityBranchesData}
            formData={formData}
            availableProjects={availableProjects}
            filePreviews={filePreviews}
            isUploading={isUploading}
            handleInputChange={handleInputChange}
            handleRadioChange={handleRadioChange}
            handleProjectSelectChange={handleProjectSelectChange}
            handleFileChange={handleFileChange}
            removeFile={removeFile}
            handleSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setSelectedActivity(null);
              setSelectedBranch(null);
              setFormData({});
              setFilePreviews([]);
            }}
          />
        )
      ) : activities.length > 0 ? (
        // 3. Si no está cargando, no hay formularios activos Y HAY actividades, muestra la tabla.
        <ActivityTable
          activities={activities}
          selectedBranch={filterBranch}
          onBranchChange={handleBranchFilter}
          onViewActivity={handleViewActivity}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
          activityBranches={activityBranchesData}
        />
      ) : (
        // 4. Si no está cargando, no hay formularios activos Y NO HAY actividades, muestra el mensaje.
        <div className="rounded-lg border border-dashed border-border p-12 text-center mt-8">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold text-foreground">
            No hay informes
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea un nuevo informe para registrar tu actividad diaria.
          </p>
          <Button
            onClick={handleCreateNewReport}
            className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2 mx-auto"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Crear Nuevo Informe
          </Button>
        </div>
      )}

      <ActivityDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedActivity(null);
        }}
        activity={selectedActivity}
        activityBranches={activityBranchesData}
      />
    </motion.div>
  );
};

export default ActivitiesPage;
