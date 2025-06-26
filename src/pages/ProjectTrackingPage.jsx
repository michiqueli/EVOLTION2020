import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CalendarDays,
  UserCheck as UserSearch,
  TrendingUp,
  FilterX,
  ArrowLeft,
  Edit2,
  Save,
  Loader2,
  Circle,
} from "lucide-react";
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
      return "bg-violet-500";
    case "Por Iniciar":
      return "bg-blue-400";
    default:
      return "bg-gray-300";
  }
};

const ProjectTrackingPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentProject, setCurrentProject] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [userFilter, setUserFilter] = useState("");

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error: projectError } = await supabase
      .from("proyectos")
      .select("uuid_id, nombre, project_type, estado, detalles_tipo_proyecto")
      .eq("uuid_id", projectId)
      .single();
    console.log(data);
    if (projectError) {
      console.error("Error fetching project details:", projectError);
      toast({
        title: "Error",
        description: "No se pudo cargar el proyecto seleccionado.",
        variant: "destructive",
      });
      setError("No se pudo cargar el proyecto.");
      setCurrentProject(null);
    } else {
      setCurrentProject(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId, toast]);

  const handleStatusChange = async (newStatus) => {
    if (!currentProject || !newStatus) return;
    setIsUpdatingStatus(true);
    const { data, error: updateError } = await supabase
      .from("proyectos")
      .update({ estado: newStatus })
      .eq("uuid_id", currentProject.uuid_id)
      .select()
      .single();

    if (updateError) {
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado: ${updateError.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Estado Actualizado",
        description: `El proyecto "${data.nombre}" ahora está ${newStatus}.`,
        variant: "success",
      });
      setCurrentProject(data);
    }
    setIsUpdatingStatus(false);
  };

  const metricsConfig = useMemo(() => {
    if (!currentProject) return [];
    switch (currentProject.project_type) {
      case "placas_industrial":
        return [
          {
            key: "plates_installed_today",
            label: "Placas Hoy",
            targetKey: "detalles_tipo_proyecto.placas_a_instalar",
            unit: "un.",
          },
          {
            key: "structure_mounted_today",
            label: "Estructura Hoy",
            targetKey: "target_structure",
            unit: currentProject.target_structure?.match(/\d+/g)
              ? ""
              : "kW/mód.",
          },
          {
            key: "cable_pulled_today",
            label: "Cable Hoy",
            targetKey: "target_cable_meters",
            unit: "mts",
          },
          {
            key: "channeling_done_today",
            label: "Canalización Hoy",
            targetKey: "target_channeling_meters",
            unit: "mts",
          },
        ];
      case "placas_domesticas":
        return [
          {
            key: "plates_installed_today",
            label: "Placas Hoy",
            targetKey: "total_plates_target",
            unit: "un.",
          },
        ];
      case "hincado":
        return [
          {
            key: "piles_driven_today",
            label: "Hincas Hoy",
            targetKey: "target_piles",
            unit: "un.",
          },
          {
            key: "predrilling_done_today",
            label: "Predrilling Hoy",
            targetKey: "target_predrilling",
            unit: "un.",
          },
          {
            key: "piles_distributed_today",
            label: "Reparto Hincas Hoy",
            targetKey: "target_piles_to_distribute",
            unit: "un.",
          },
        ];
      default:
        return [
          {
            key: "plates_installed_today",
            label: "Placas Hoy",
            targetKey: "total_plates_target",
            unit: "un.",
          },
        ];
    }
  }, [currentProject]);

  const filteredData = useMemo(() => {
    let data = [...trackingData];
    if (dateFilter.start)
      data = data.filter(
        (item) => new Date(item.report_date) >= new Date(dateFilter.start)
      );
    if (dateFilter.end)
      data = data.filter(
        (item) => new Date(item.report_date) <= new Date(dateFilter.end)
      );
    if (userFilter)
      data = data.filter(
        (item) =>
          item.user_name &&
          item.user_name.toLowerCase().includes(userFilter.toLowerCase())
      );

    const cumulativeValues = {};
    metricsConfig.forEach((metric) => (cumulativeValues[metric.key] = 0));

    return data
      .sort((a, b) => new Date(a.report_date) - new Date(b.report_date))
      .map((item) => {
        const newItem = {
          ...item,
          cumulative_metrics: {},
          progress_metrics: {},
        };
        metricsConfig.forEach((metric) => {
          const valueToday = Number(item[metric.key]) || 0;
          cumulativeValues[metric.key] += valueToday;
          newItem.cumulative_metrics[metric.key] = cumulativeValues[metric.key];

          const targetValue =
            Number(
              currentProject?.[metric.targetKey]
                ?.toString()
                .match(/\d+/)?.[0] || currentProject?.[metric.targetKey]
            ) || 0;
          newItem.progress_metrics[metric.key] =
            targetValue > 0
              ? (cumulativeValues[metric.key] / targetValue) * 100
              : 0;
        });
        return newItem;
      })
      .sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
  }, [trackingData, dateFilter, userFilter, currentProject, metricsConfig]);

  const clearFilters = () => {
    setDateFilter({ start: "", end: "" });
    setUserFilter("");
  };

  if (!user) return <p>Por favor, inicie sesión para ver esta página.</p>;

  const renderMetricValue = (value, unit) => {
    if (value === null || typeof value === "undefined") return "N/A";
    return `${value} ${unit || ""}`.trim();
  };

  const statusColor = currentProject
    ? getStatusColor(currentProject.estado)
    : "bg-gray-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-1"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary text-right">
          Seguimiento Detallado
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate("/projects")}
          className="text-primary border-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Proyectos
        </Button>
      </div>

      {loading && !currentProject && (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      )}
      {!loading && !currentProject && error && (
        <p className="text-center text-destructive py-8 flex items-center justify-center gap-2">
          <AlertCircle /> {error}
        </p>
      )}

      {currentProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card p-6 rounded-xl shadow-lg border border-border"
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1 flex items-center">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full mr-3 shrink-0",
                    statusColor
                  )}
                ></div>
                Resumen del Proyecto
              </h2>
              <p className="text-primary text-2xl font-bold mb-1">
                {currentProject.nombre}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentProject.project_type}
              </p>
            </div>
            <div className="flex items-center gap-2 min-w-[200px]">
              <Select
                value={currentProject.estado}
                onValueChange={handleStatusChange}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="w-full bg-background border-input data-[placeholder]:text-muted-foreground">
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
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(
              metricsConfig.length,
              4
            )} gap-4`}
          >
            {metricsConfig.map((metric) => {
              const target =
                Number(
                  currentProject?.[metric.targetKey]
                    ?.toString()
                    .match(/\d+/)?.[0] || currentProject?.[metric.targetKey]
                ) || 0;
              const accumulated =
                filteredData[0]?.cumulative_metrics?.[metric.key] || 0;
              const progress =
                filteredData[0]?.progress_metrics?.[metric.key] || 0;
              return (
                <div
                  key={metric.key}
                  className="bg-background p-4 rounded-lg border border-border"
                >
                  <p className="text-sm text-muted-foreground">
                    {metric.label.replace(" Hoy", "")} Objetivo
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {renderMetricValue(target, metric.unit)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Acumulado
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {renderMetricValue(accumulated, metric.unit)}
                  </p>
                  <Progress
                    value={progress}
                    className="w-full h-2 mt-2 [&>div]:bg-primary"
                  />
                  <p className="text-right text-xs text-primary mt-0.5">
                    {progress.toFixed(1)}%
                  </p>
                </div>
              );
            })}
            {metricsConfig.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-4">
                No hay métricas de seguimiento definidas para este tipo de
                proyecto.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {currentProject && (
        <>
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Filtros de Informes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label
                  htmlFor="dateStart"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Fecha Inicio
                </label>
                <Input
                  type="date"
                  id="dateStart"
                  value={dateFilter.start}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      start: e.target.value,
                    }))
                  }
                  className="bg-background border-input"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="dateEnd"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Fecha Fin
                </label>
                <Input
                  type="date"
                  id="dateEnd"
                  value={dateFilter.end}
                  onChange={(e) =>
                    setDateFilter((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="bg-background border-input"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="userFilter"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Filtrar por Usuario
                </label>
                <Input
                  type="text"
                  id="userFilter"
                  placeholder="Nombre del usuario..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="bg-background border-input"
                />
              </div>
            </div>
            <Button
              onClick={clearFilters}
              variant="outline"
              className="text-primary border-primary hover:bg-primary/10"
            >
              <FilterX className="mr-2 h-4 w-4" /> Limpiar Filtros
            </Button>
          </div>

          {loading && trackingData.length === 0 && !currentProject && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
          {loading && trackingData.length === 0 && currentProject && (
            <p className="text-center text-muted-foreground py-8">
              Cargando datos de seguimiento...
            </p>
          )}
          {!loading && error && !trackingData.length && (
            <p className="text-center text-destructive py-8 flex items-center justify-center gap-2">
              <AlertCircle /> {error}
            </p>
          )}

          {!loading &&
            !error &&
            filteredData.length === 0 &&
            currentProject && (
              <div className="text-center py-10 bg-card rounded-lg border border-border">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-xl font-semibold">
                  No hay datos de seguimiento
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No se encontraron informes para este proyecto o filtros
                  aplicados.
                </p>
              </div>
            )}

          {!loading && !error && filteredData.length > 0 && (
            <div className="overflow-x-auto bg-card rounded-xl shadow-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-secondary/20">
                    <TableHead className="text-foreground">Fecha</TableHead>
                    {metricsConfig.map((metric) => (
                      <TableHead
                        key={metric.key}
                        className="text-foreground text-right"
                      >
                        {metric.label} ({metric.unit})
                      </TableHead>
                    ))}
                    {metricsConfig.length === 0 && (
                      <TableHead className="text-foreground text-center col-span-full">
                        No hay métricas configuradas
                      </TableHead>
                    )}
                    <TableHead className="text-foreground">Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-secondary/10">
                      <TableCell>
                        {new Date(item.report_date).toLocaleDateString()}
                      </TableCell>
                      {metricsConfig.map((metric) => (
                        <TableCell
                          key={metric.key}
                          className="text-right font-medium text-primary"
                        >
                          {renderMetricValue(item[metric.key], "")}
                        </TableCell>
                      ))}
                      {metricsConfig.length === 0 && (
                        <TableCell className="text-center col-span-full">
                          -
                        </TableCell>
                      )}
                      <TableCell className="text-muted-foreground">
                        {item.user_name || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default ProjectTrackingPage;
