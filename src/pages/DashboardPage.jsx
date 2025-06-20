import React, { useState, useEffect, useCallback } from "react";
import { ActiveTimerCard } from "@/components/dashboard/DashboardActiveTimerCard";
import { StatCard } from "@/components/dashboard/DashboardStatCard";
import { ActionCard } from "@/components/dashboard/DashboardActionCard";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  PenLine as FilePenLine,
  MessageSquare,
  Briefcase,
  AlertTriangle,
  Zap,
  HardHat,
  Settings2,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { format, startOfWeek } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";

const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds < 0) return "00h 00m 00s";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(
    2,
    "0"
  )}m ${String(seconds).padStart(2, "0")}s`;
};
const DashboardPage = () => {
  const {
    user,
    activeProjectId,
    setCurrentActiveProject,
    clearActiveProject,
    ROLES,
  } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdminOrCEO =
    user &&
    (user.rol === ROLES.ADMIN ||
      user.rol === ROLES.CEO ||
      user.rol === ROLES.DEVELOPER);
  const [projects, setProjects] = useState([]);
  const [selectedDashboardProject, setSelectedDashboardProject] = useState(
    activeProjectId || ""
  );
  const [activeTimerInfo, setActiveTimerInfo] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00h 00m 00s");
  const [weeklyHours, setWeeklyHours] = useState(0);
  const weeklyGoal = 40;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectsForSelect = async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select("uuid_id, nombre, project_type")
        .eq("estado", "En Proceso")
        .order("nombre");
      if (error) {
        console.error("Error fetching projects for dashboard select:", error);
      } else {
        setProjects(data || []);
        if (
          activeProjectId &&
          !data.find((p) => p.uuid_id === activeProjectId)
        ) {
          clearActiveProject();
          setSelectedDashboardProject("");
        }
      }
    };
    fetchProjectsForSelect();
  }, [activeProjectId, clearActiveProject]);

  useEffect(() => {
    setSelectedDashboardProject(activeProjectId || "");
  }, [activeProjectId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      // 2. Obtener fichajes de la semana y el fichaje activo
      const today = new Date();
      const weekStart = format(
        startOfWeek(today, { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );

      const { data: entriesData, error } = await supabase
        .from("time_tracking")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", weekStart);

      if (error) return;

      // Calculamos horas trabajadas de la semana
      const totalHours = entriesData
        .filter((e) => e.work_time)
        .reduce((sum, current) => sum + current.work_time, 0);
      setWeeklyHours(totalHours);

      // Buscamos un timer activo
      const runningTimer = entriesData.find((e) => !e.end_time);
      if (runningTimer) {
        setActiveTimerInfo({
          id: runningTimer.id,
          start_time: runningTimer.start_time,
        });
      }
    };
    fetchInitialData();
  }, [user.id]);

  useEffect(() => {
    let intervalId;
    if (activeTimerInfo) {
      const startTime = new Date(activeTimerInfo.start_time);
      intervalId = setInterval(() => {
        setElapsedTime(formatDuration(new Date() - startTime));
      }, 1000);
    } else {
      setElapsedTime("00h 00m 00s");
    }
    return () => clearInterval(intervalId);
  }, [activeTimerInfo]);

  const handleProjectChange = (projectId) => {
    if (projectId === "none") {
      clearActiveProject();
      setSelectedDashboardProject("");
      toast({
        title: "Proyecto Deseleccionado",
        description: "No hay ningún proyecto activo seleccionado.",
        variant: "info",
      });
    } else {
      const project = projects.find((p) => p.uuid_id === projectId);
      console.log(project);
      if (project) {
        setSelectedDashboardProject(projectId);
        setCurrentActiveProject(project.uuid_id, project.project_type);
        toast({
          title: "Proyecto Activo Cambiado",
          description: `Ahora estás trabajando en "${project.nombre}".`,
          variant: "success",
        });
      }
    }
  };
  const actionCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  const handleStartTimer = async () => {
    // Validación para asegurar que hay un proyecto seleccionado
    if (!activeProjectId) {
      toast({
        title: "Selecciona un Proyecto",
        description: "Debes elegir un proyecto antes de iniciar un fichaje.",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("time_tracking")
        .insert({
          user_id: user.id,
          project_id: activeProjectId,
          date: new Date().toISOString().split("T")[0],
          start_time: new Date().toISOString(),
        })
        .select("id, start_time") // Pedimos que nos devuelva el nuevo ID y la hora de inicio
        .single();

      if (error) throw error;

      // Actualizamos el estado para que el cronómetro empiece a correr
      setActiveTimerInfo({ id: data.id, start_time: data.start_time });

      toast({ title: "Fichaje Iniciado", variant: "success" });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo iniciar el fichaje: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimerInfo) return;

    setIsLoading(true);
    try {
      const startTime = new Date(activeTimerInfo.start_time);
      const endTime = new Date();
      const workedHours = (endTime - startTime) / (1000 * 60 * 60);

      // Actualizamos el fichaje con la hora de fin y el tiempo total trabajado
      const { error: updateError } = await supabase
        .from("time_tracking")
        .update({
          end_time: endTime.toISOString(),
          work_time: workedHours,
        })
        .eq("id", activeTimerInfo.id);

      if (updateError) throw updateError;

      toast({
        title: "Fichaje Detenido",
        description: `Tiempo trabajado: ${workedHours.toFixed(2)} hs.`,
        variant: "success",
      });

      // Ahora, si había un proyecto, actualizamos sus horas
      if (activeProjectId) {
        // Obtenemos las horas actuales del proyecto
        const { data: projectData, error: projectFetchError } = await supabase
          .from("proyectos")
          .select("horas, nombre")
          .eq("uuid_id", activeProjectId)
          .single();

        if (projectFetchError) throw projectFetchError;

        const currentHours = projectData.horas || 0;
        const newHours = currentHours + workedHours;

        // Actualizamos el proyecto
        const { error: updateProjectError } = await supabase
          .from("proyectos")
          .update({ horas: newHours })
          .eq("uuid_id", activeProjectId);

        if (updateProjectError) throw updateProjectError;

        toast({
          title: "Horas Sumadas al Proyecto",
          description: `Se añadieron ${workedHours.toFixed(2)} hs a "${
            projectData.nombre
          }".`,
          variant: "success",
        });
      }

      // Reseteamos y actualizamos la UI
      setActiveTimerInfo(null);
      setWeeklyHours((prev) => prev + workedHours); // Actualizamos el total semanal en la UI
    } catch (error) {
      toast({
        title: "Error al detener el fichaje",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 p-2">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            ¡Hola,{" "}
            <span className="text-primary">
              {user?.nombre ? user.nombre.split(" ")[0] : "Usuario"}
            </span>
            !
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Bienvenido de nuevo a EVOLTION2020.
          </p>
        </div>
        {user && (
          <span className="text-md text-muted-foreground self-start md:self-center mt-2 md:mt-0 capitalize">
            Tu rol: {user.rol}
          </span>
        )}
      </motion.div>

      {user &&
        (user.rol === ROLES.WORKER ||
          user.rol === ROLES.DEVELOPER) && (
          <motion.div
          >
            <ActiveTimerCard
              projects={projects}
              activeProjectId={activeProjectId}
              onProjectChange={handleProjectChange}
              isTimerActive={!!activeTimerInfo}
              onStartTimer={handleStartTimer}
              onStopTimer={handleStopTimer}
              elapsedTime={elapsedTime}
              weeklyHours={weeklyHours}
              weeklyGoal={weeklyGoal}
            />
          </motion.div>
        )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div
          variants={actionCardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <ActionCard
            title="Planificación del Día"
            description="Consulta tu proyecto, vehículo, materiales y tareas asignadas para hoy."
            icon={CalendarDays}
            onClick={() => navigate("/planning")}
          />
        </motion.div>
        <motion.div
          variants={actionCardVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <ActionCard
            title="Crear Informe Diario"
            description="Registra tus actividades, avances e incidencias de la jornada laboral."
            icon={FilePenLine}
            onClick={() => navigate("/activities?action=new")}
          />
        </motion.div>
        <motion.div
          variants={actionCardVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <ActionCard
            title="Chat con ChatEVO"
            description="Tu asistente IA para resolver dudas, buscar documentos y optimizar tareas."
            icon={MessageSquare}
            onClick={() => navigate("/assistant")}
          />
        </motion.div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Proyectos Activos"
          value={isAdminOrCEO ? "12" : activeProjectId ? "1" : "0"}
          icon={Briefcase}
          color="bg-primary"
          hoverColor="hsl(var(--primary)/0.3)"
          description={
            isAdminOrCEO
              ? "+2 esta semana"
              : activeProjectId
              ? "Asignado a ti"
              : "Selecciona un proyecto"
          }
        />
        {isAdminOrCEO && (
          <StatCard
            title="Alertas Críticas"
            value="3"
            icon={AlertTriangle}
            color="bg-destructive"
            hoverColor="hsl(var(--destructive)/0.3)"
            description="Requieren atención inmediata"
          />
        )}
        <StatCard
          title="Tareas Completadas Hoy"
          value="27"
          icon={Zap}
          color="bg-green-500"
          hoverColor="hsla(140, 70%, 40%, 0.3)"
          description="¡Buen trabajo equipo!"
        />
      </div>

      <motion.div
        className="mt-10 rounded-xl border border-border bg-card p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-card-foreground mb-4">
          Actividad Reciente del Equipo
        </h2>
        <ul className="space-y-3">
          <li className="flex items-center justify-between p-3 bg-secondary/50 rounded-md hover:bg-secondary transition-colors">
            <div>
              <p className="font-medium text-foreground">
                Nuevo plano subido al Proyecto Alpha
              </p>
              <p className="text-sm text-muted-foreground">
                Por <span className="text-primary">Elena Campos</span> - Hace 15
                minutos
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
            >
              Ver
            </Button>
          </li>
          <li className="flex items-center justify-between p-3 bg-secondary/50 rounded-md hover:bg-secondary transition-colors">
            <div>
              <p className="font-medium text-foreground">
                Tarea "Revisión Estructural" completada en Proyecto Beta
              </p>
              <p className="text-sm text-muted-foreground">
                Por <span className="text-primary">Carlos Ruiz</span> - Hace 1
                hora
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
            >
              Detalles
            </Button>
          </li>
        </ul>
      </motion.div>

      {user && (user.role === "worker" || user.role === "TECNICO") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.5,
          }}
          className="fixed bottom-6 right-6 z-50 print:hidden"
        >
          <Button
            size="lg"
            className="rounded-full shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 w-16 h-16 p-0 flex items-center justify-center"
            title="Activar Modo Obra (Simplificado)"
            onClick={() => console.log("Modo Obra Activado (Conceptual)")}
          >
            <HardHat className="h-7 w-7" />
          </Button>
        </motion.div>
      )}

      {isAdminOrCEO && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.5,
          }}
          className="fixed bottom-6 right-6 z-50 print:hidden"
        >
          <Button
            size="lg"
            className="rounded-full shadow-2xl bg-secondary text-secondary-foreground hover:bg-secondary/80 w-16 h-16 p-0 flex items-center justify-center"
            title="Configuración Avanzada"
            onClick={() => console.log("Configuración Avanzada (Conceptual)")}
          >
            <Settings2 className="h-7 w-7" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
