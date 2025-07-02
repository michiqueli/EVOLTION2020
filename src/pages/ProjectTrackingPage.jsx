import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const projectStates = [
  "Por Iniciar",
  "En Proceso",
  "Pausado",
  "Finalizada",
  "Cancelado",
];

const getStatusColor = (status) => {
  switch (status) {
    case "Cancelado":
      return "bg-red-500";
    case "Pausado":
      return "bg-yellow-500";
    case "En Proceso":
      return "bg-green-500";
    case "Finalizada":
      return "bg-cyan-500";
    case "Por Iniciar":
      return "bg-blue-400";
    default:
      return "bg-gray-300";
  }
};

// 1. "Biblioteca" central con TODAS las métricas posibles
const ALL_METRICS_CONFIG = {
  placas_industrial: [
    {
      key: "placas",
      label: "Placas a Instaladar",
      unit: "un.",
      reportKey: "placas_instaladas",
      targetKey: "placas_a_instalar",
    },
    {
      key: "estructura",
      label: "Estructura a Instalar",
      unit: "un.",
      reportKey: "estructura_instalada",
      targetKey: "estructura_a_instalar",
    },
    {
      key: "cable",
      label: "Metros de Cable",
      unit: "mts",
      reportKey: "metros_cable_tendido",
      targetKey: "metros_cable",
    },
    {
      key: "canalizacion",
      label: "Metro de Canalización",
      unit: "mts",
      reportKey: "metros_canalizacion_realizada",
      targetKey: "metros_canalizacion",
    },
  ],
  hincado: [
    {
      key: "hincas",
      label: "Total de Hincas",
      unit: "un.",
      reportKey: "hincas_realizadas",
      targetKey: "hincas",
    },
    {
      key: "predrilling",
      label: "Total de Pre-Drilling",
      unit: "un.",
      reportKey: "predrilling_realizado",
      targetKey: "predrilling",
    },
    {
      key: "reparto",
      label: "Reparto de Hincas",
      unit: "un.",
      reportKey: "reparto_hincas",
      targetKey: "hincas_repartir",
    },
  ],
  seguridad_altura: [
    {
      key: "valla",
      label: "Total de Valla Perimetral",
      unit: "mts",
      reportKey: "valla_perimetral_instalada",
      targetKey: "valla_perimetral",
    },
    {
      key: "escaleras",
      label: "Escaleras a Instalar",
      unit: "un.",
      reportKey: "escaleras_instaladas",
      targetKey: "escaleras_instaladas",
    },
    {
      key: "lineas",
      label: "Líneas de Vida a Instalar",
      unit: "un.",
      reportKey: "lineas_de_vida_instaladas",
      targetKey: "lineas_vida",
    },
  ],
};

const getNestedValue = (obj, path) => {
  if (!path || !obj) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

const ProjectTrackingPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activityReports, setActivityReports] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      try {
        // Obtenemos los detalles del proyecto
        const { data: projectData, error: projectError } = await supabase
          .from("proyectos")
          .select(
            "uuid_id, nombre, project_type, estado, detalles_tipo_proyecto"
          )
          .eq("uuid_id", projectId)
          .single();
        if (projectError) throw projectError;
        setCurrentProject(projectData);

        // Obtenemos TODOS los informes diarios para este proyecto
        const { data: reportsData, error: reportsError } = await supabase
          .from("daily_reports")
          .select("*")
          .eq("project_id", projectData.uuid_id);
        if (reportsError) throw reportsError;
        setActivityReports(reportsData || []);
      } catch (err) {
        console.error("Error fetching project data:", err);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del proyecto.",
          variant: "destructive",
        });
        setError("No se pudieron cargar los datos.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [projectId, toast]);

  const metricsConfig = useMemo(() => {
    if (!currentProject || !Array.isArray(currentProject.project_type))
      return [];
    return currentProject.project_type.flatMap(
      (type) => ALL_METRICS_CONFIG[type] || []
    );
  }, [currentProject]);

  // --- PASO 2: useMemo PARA CALCULAR EL PROGRESO ---
  const progressData = useMemo(() => {
    if (activityReports.length === 0 || metricsConfig.length === 0) {
      return { accumulated: {}, progress: {} };
    }

    const accumulated = {};
    const progress = {};

    metricsConfig.forEach(metric => {
      // Para sumar, usamos la clave del reporte diario (reportKey)
      accumulated[metric.key] = activityReports.reduce((sum, report) => {
        return sum + (Number(report[metric.reportKey]) || 0);
      }, 0);
    });

    metricsConfig.forEach(metric => {
      // Para el objetivo, usamos la clave de los detalles del proyecto (targetKey)
      const target = currentProject.detalles_tipo_proyecto?.[metric.targetKey] || 0;
      
      if (target > 0) {
        progress[metric.key] = (accumulated[metric.key] / target) * 100;
      } else {
        progress[metric.key] = 0;
      }
    });

    return { accumulated, progress };
  }, [activityReports, metricsConfig, currentProject]);

  const handleStatusChange = async (newStatus) => {
    if (!currentProject || !newStatus) return;
    setIsUpdatingStatus(true);
    try {
      const { data, error: updateError } = await supabase
        .from("proyectos")
        .update({ estado: newStatus })
        .eq("uuid_id", currentProject.uuid_id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({ title: "Estado Actualizado", variant: "success" });
      setCurrentProject(data); // Actualizamos el proyecto en el estado local con los nuevos datos
    } catch (err) {
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-destructive py-10 text-lg">{error}</p>
    );
  }

  if (!currentProject) {
    return (
      <p className="text-center text-muted-foreground py-10 text-lg">
        Proyecto no encontrado o no existe.
      </p>
    );
  }

  const statusColor = getStatusColor(currentProject.estado);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">
          Seguimiento Detallado
        </h1>
        <Button variant="outline" onClick={() => navigate("/tracking")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la Selección de Proyectos
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card p-6 rounded-xl shadow-lg border"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={cn("w-4 h-4 rounded-full shrink-0", statusColor)}
              ></div>
              <h2 className="text-xl font-semibold text-foreground">
                Resumen del Proyecto
              </h2>
            </div>
            <p className="text-primary text-2xl font-bold">
              {currentProject.nombre}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {(currentProject.project_type || [])
                .join(" + ")
                .replace(/_/g, " ")}
            </p>
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <Select
              value={currentProject.estado}
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Cambiar estado" />
              </SelectTrigger>
              <SelectContent>
                {projectStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdatingStatus && (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            )}
          </div>
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${
            Math.min(metricsConfig.length, 4) || 1
          } gap-4`}
        >
          {metricsConfig.map((metric) => {
            const target =
              getNestedValue(
                currentProject.detalles_tipo_proyecto,
                metric.targetKey
              ) || 0;
            // Obtenemos los valores reales desde nuestro nuevo objeto 'progressData'
            const accumulated = progressData.accumulated?.[metric.key] || 0;
            const progress = progressData.progress?.[metric.key] || 0;

            return (
              <div
                key={metric.key}
                className="bg-background p-4 rounded-lg border"
              >
                <p className="text-sm font-semibold text-muted-foreground">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {target}{" "}
                  <span className="text-lg font-normal text-muted-foreground">
                    {metric.unit}
                  </span>
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Acumulado: {accumulated} {metric.unit}
                    </span>
                    {/* Mostramos el porcentaje con un decimal */}
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  {/* La barra de progreso ahora muestra el valor real */}
                  <Progress value={progress} className="h-2 mt-1" />
                </div>
              </div>
            );
          })}
          {metricsConfig.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-4">
              No hay métricas definidas para este tipo de proyecto.
            </p>
          )}
        </div>
      </motion.div>

      {/* Aquí irá la lógica y la tabla de informes diarios en el futuro */}
    </motion.div>
  );
};

export default ProjectTrackingPage;
