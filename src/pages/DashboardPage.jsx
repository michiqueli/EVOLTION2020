import React, { useState, useEffect, useCallback } from "react";
import { ActiveTimerCard } from "@/components/dashboard/DashboardActiveTimerCard";
import { StatCard } from "@/components/dashboard/DashboardStatCard";
import { ActionCard } from "@/components/dashboard/DashboardActionCard";
import { motion } from "framer-motion";
import {
  CalendarDays,
  PenLine as FilePenLine,
  Briefcase,
  AlertTriangle,
  Car,
  Clock,
  Users,
  Loader2,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { format, startOfWeek } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds < 0) return "00h 00m 00s";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600); // Horas completas
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
    isOtherProject,
  } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdminOrCEO =
    user &&
    (user.rol === ROLES.ADMIN ||
      user.rol === ROLES.CEO ||
      user.rol === ROLES.DEVELOPER);
  const [projects, setProjects] = useState([]);
  const [activeTimerInfo, setActiveTimerInfo] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00h 00m 00s");
  const [weeklyHours, setWeeklyHours] = useState(0);
  const weeklyGoal = 40;
  const [isLoading, setIsLoading] = useState(true);

  const [todaysPlanning, setTodaysPlanning] = useState(null);
  const [allVehicles, setAllVehicles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const fetchProjectsForSelect = async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select("id, nombre, project_type")
        .eq("estado", "En Proceso")
        .order("nombre");
      if (error) {
        console.error("Error fetching projects for dashboard select:", error);
      } else {
        setProjects(data || []);
        if (activeProjectId && !data.find((p) => p.id === activeProjectId)) {
          clearActiveProject();
        }
      }
    };
    fetchProjectsForSelect();
  }, [activeProjectId, clearActiveProject]);

  useEffect(() => {
    const fetchAllDashboardData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        setTodaysPlanning(null);
        return;
      }
      setIsLoading(true);

      const today = new Date();
      const todayISO = format(today, "yyyy-MM-dd");
      const weekStart = format(
        startOfWeek(today, { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );

      try {
        // --- Carga de Time Tracking ---
        const { data: entriesData, error: entriesError } = await supabase
          .from("time_tracking")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", weekStart);

        if (entriesError) throw entriesError;

        const totalHours = entriesData
          .filter((e) => e.work_time)
          .reduce((sum, current) => sum + current.work_time, 0);
        setWeeklyHours(totalHours);

        const runningTimer = entriesData.find((e) => !e.end_time);
        if (runningTimer) {
          setActiveTimerInfo({
            id: runningTimer.id,
            start_time: runningTimer.start_time,
          });
        }

        // --- Carga de datos para Planificación del Día ---
        // Cargar TODOS los vehículos para resolver nombres
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from("vehiculos")
          .select("id, numero_interno, patente");
        if (vehiclesError) throw vehiclesError;
        setAllVehicles(vehiclesData || []);

        // Cargar TODOS los usuarios para resolver nombres de técnicos
        const { data: usersData, error: usersError } = await supabase
          .from("usuarios")
          .select("id, nombre");
        if (usersError) throw usersError;
        setAllUsers(usersData || []);

        // Buscar las asignaciones del usuario para hoy (puede ser más de una)
        const { data: userAssignmentsForToday, error: userAssignmentsError } =
          await supabase
            .from("planificaciones")
            .select(
              `
            id,
            usuario_id,
            proyecto_id,
            assignment_date,
            metadata,
            proyectos ( nombre, vehiculos_asignados, default_start_time )
          `
            )
            .eq("usuario_id", user.id)
            .eq("assignment_date", todayISO);

        if (userAssignmentsError) {
          console.error(
            "Error fetching user's assignments for today:",
            userAssignmentsError
          );
          setTodaysPlanning(null);
        } else if (
          userAssignmentsForToday &&
          userAssignmentsForToday.length > 0
        ) {
          const mainAssignment = userAssignmentsForToday[0]; // Tomamos la primera como principal

          // Buscar *todas* las asignaciones para el MISMO proyecto y fecha
          const {
            data: projectAssignmentsForToday,
            error: projectAssignmentsError,
          } = await supabase
            .from("planificaciones")
            .select("usuario_id")
            .eq("proyecto_id", mainAssignment.proyecto_id)
            .eq("assignment_date", todayISO);

          if (projectAssignmentsError) {
            console.error(
              "Error fetching all assignments for project today:",
              projectAssignmentsError
            );
          }

          setTodaysPlanning({
            ...mainAssignment,
            allProjectTechnicians: projectAssignmentsForToday || [],
          });
        } else {
          setTodaysPlanning(null); // No hay asignación para hoy
        }
      } catch (error) {
        console.error("General error fetching all dashboard data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del dashboard.",
          variant: "destructive",
        });
        setTodaysPlanning(null);
        setAllVehicles([]);
        setAllUsers([]);
        setWeeklyHours(0);
        setActiveTimerInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDashboardData();
  }, [user?.id, toast]);

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
    setCurrentActiveProject(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      toast({
        title: "Proyecto Activo Cambiado",
        description: `Ahora estás trabajando en "${project.nombre}".`,
        variant: "success",
      });
    } else {
      toast({
        title: "Proyecto Activo Cambiado",
        description: `Seleccionaste "OTRO" como proyecto, por favor no olvides describir de que se trata.`,
        variant: "info",
      });
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
    if (!activeProjectId && !isOtherProject) {
      toast({
        title: "Selecciona un Proyecto",
        description:
          "Debes elegir un proyecto o la opción 'OTRO' para iniciar un fichaje.",
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
          project_id: isOtherProject ? "OTRO" : activeProjectId,
          start_time: new Date().toISOString(),
          date: new Date().toISOString().split("T")[0],
          is_other_project: isOtherProject,
        })
        .select("id, start_time")
        .single();

      if (error) throw error;

      setActiveTimerInfo({ id: data.id, start_time: data.start_time });
      toast({
        title: "Fichaje Iniciado",
        variant: "success",
        description: "El contador ha comenzado.",
      });
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

      if (activeProjectId) {
        const { data: projectData, error: projectFetchError } = await supabase
          .from("proyectos")
          .select("horas, nombre")
          .eq("id", activeProjectId)
          .single();

        if (projectFetchError) throw projectFetchError;

        const currentHours = projectData.horas || 0;
        const newHours = currentHours + workedHours;

        const { error: updateProjectError } = await supabase
          .from("proyectos")
          .update({ horas: newHours })
          .eq("id", activeProjectId);

        if (updateProjectError) throw updateProjectError;

        toast({
          title: "Horas Sumadas al Proyecto",
          description: `Se añadieron ${workedHours.toFixed(2)} hs a "${
            projectData.nombre
          }".`,
          variant: "success",
        });
      }

      setActiveTimerInfo(null);
      setWeeklyHours((prev) => prev + workedHours);
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

  const getPlanningDescription = useCallback(() => {
    if (isLoading) {
      return (
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Cargando tu planificación...</span>
        </div>
      );
    }

    if (!todaysPlanning || !todaysPlanning.proyectos) {
      return (
        <div className="text-center text-muted-foreground">
          <p>No tienes ninguna obra asignada para hoy.</p>
          <p className="text-sm">
            ¡Disfruta tu día o consulta con tu supervisor!
          </p>
        </div>
      );
    }

    const project = todaysPlanning.proyectos;
    const assignedVehiclesIds = project?.vehiculos_asignados || [];
    const allTechniciansAssignedToday =
      todaysPlanning.allProjectTechnicians || [];

    const vehicleDisplays = assignedVehiclesIds
      .map((vId) => {
        const vehicle = allVehicles.find((v) => v.id === vId);
        return vehicle
          ? `${vehicle.numero_interno} - ${vehicle.patente}`
          : null;
      })
      .filter(Boolean);

    const uniqueTechnicianIds = [
      ...new Set(
        allTechniciansAssignedToday.map((assign) => assign.usuario_id)
      ),
    ];
    const techniciansNames = uniqueTechnicianIds
      .map((uId) => allUsers.find((u) => u.id === uId)?.nombre)
      .filter(Boolean);

    const currentUserName = user?.nombre || "Tú";
    const otherTechniciansNames = techniciansNames.filter(
      (name) => name !== currentUserName
    );
    // --- AHORA CONSTRUIMOS COMPONENTES JSX ---
    return (
      <div className="space-y-3 text-sm">
        {/* Obra Asignada */}
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-muted-foreground">Obra asignada</p>
            <p className="font-bold text-base text-foreground">
              {project?.nombre || "N/A"}
            </p>
          </div>
        </div>

        {/* Hora de Inicio */}
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-muted-foreground">Hora de inicio</p>
            <p className="font-bold text-base text-foreground">
              {project?.default_start_time || "No especificada"}
            </p>
          </div>
        </div>

        {/* Vehículos */}
        <div className="flex items-start gap-3">
          <Car className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground">Vehículos asignados</p>
            {vehicleDisplays.length > 0 ? (
              <div className="flex flex-col items-start">
                {vehicleDisplays.map((v) => (
                  <strong key={v} className="text-foreground">
                    {v}
                  </strong>
                ))}
              </div>
            ) : (
              <strong className="text-foreground">Ninguno</strong>
            )}
          </div>
        </div>

        {/* Compañeros */}
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground">Equipo para hoy</p>
            <div className="flex flex-col items-start">
              <strong className="text-foreground">
                {currentUserName} (Tú)
              </strong>
              {otherTechniciansNames.map((name) => (
                <span key={name} className="text-foreground">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }, [isLoading, todaysPlanning, allVehicles, allUsers, user]);

  const goToCreateReport = () => {
    // Navegamos y pasamos un objeto 'state' con nuestra instrucción
    navigate("/activities", { state: { action: "createReport" } });
  };

  return (
    <div className="space-y-10 p-2">
      <motion.div
        className="flex flex-col md:flex-row justify-between md:items-center mb-8 text-center items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full">
          <h1 className="text-4xl font-bold tracking-tight text-foreground w-full">
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
      </motion.div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        <motion.div
          variants={actionCardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <ActionCard
            title="Planificación del Día"
            description={getPlanningDescription()}
            icon={CalendarDays}
            onClick={() => navigate("/planning")}
            buttonTittle="Ver Toda la Planificación"
          />
        </motion.div>
        <motion.div
        variants={actionCardVariants}
          initial="hidden"
          animate="visible"
          custom={0}>
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
            isOtherProject={isOtherProject}
          />
        </motion.div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
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
            onClick={goToCreateReport}
            buttonTittle="Crear ahora"
          />
        </motion.div>
        <motion.div
          variants={actionCardVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <ActionCard
            title={isAdminOrCEO ? "Proyectos Activos" : "Proyecto asigando"}
            description={
              isAdminOrCEO
                ? "Accede al completo de proyectos"
                : "Accede a ver tu proyecto"
            }
            icon={Briefcase}
            onClick={
              isAdminOrCEO
                ? () => navigate("/projects")
                : () => navigate("/projects")
            }
            buttonTittle="Ver ahora"
          />
        </motion.div>
        {/*<StatCard
          title="Alertas"
          value="3"
          icon={AlertTriangle}
          color="bg-destructive"
          hoverColor="hsl(var(--destructive)/0.1)"
          description="Requieren atención inmediata"
        />*/}
      </div>
    </div>
  );
};

export default DashboardPage;
