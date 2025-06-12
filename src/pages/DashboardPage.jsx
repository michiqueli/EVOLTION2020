
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, PenLine as FilePenLine, MessageSquare, Briefcase, AlertTriangle, Zap, HardHat, Settings2, CheckCircle } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/components/ui/use-toast";

const ActionCard = ({ title, description, icon: Icon, onClick, bgColor = 'bg-card', textColor = 'text-card-foreground', accentColor = 'text-primary' }) => (
  <motion.div
    className={`rounded-xl border border-border ${bgColor} p-6 shadow-lg cursor-pointer h-full flex flex-col justify-between`}
    whileHover={{ y: -6, boxShadow: "0px 10px 20px hsla(var(--primary-values)/0.2), 0px 3px 8px hsla(var(--primary-values)/0.1)" }}
    transition={{ type: "spring", stiffness: 300, damping: 15 }}
    onClick={onClick}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div>
      <div className={`mb-4 inline-block rounded-lg p-3 bg-primary/10`}>
        <Icon className={`h-8 w-8 ${accentColor}`} />
      </div>
      <h3 className={`mb-2 text-xl font-semibold ${textColor}`}>{title}</h3>
      <p className={`text-sm text-muted-foreground`}>{description}</p>
    </div>
    <Button variant="link" className={`mt-4 p-0 self-start ${accentColor} hover:underline`}>
      Acceder
    </Button>
  </motion.div>
);

const StatCard = ({ title, value, icon, color, description, hoverColor }) => (
  <motion.div
    className={`rounded-xl border border-border bg-card p-6 shadow-lg`}
    whileHover={{ y: -5, boxShadow: `0 10px 15px -3px ${hoverColor || 'hsl(var(--primary)/0.2)'}, 0 4px 6px -2px ${hoverColor || 'hsl(var(--primary)/0.1)'}` }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      <div className={`rounded-full p-2 ${color}`}>
        {React.createElement(icon, { className: "h-6 w-6 text-primary-foreground" })}
      </div>
    </div>
    <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
  </motion.div>
);


const DashboardPage = () => {
  const { user, activeProjectId, activeProjectType, setCurrentActiveProject, clearActiveProject } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdminOrCEO = user && (user.role === 'admin' || user.role === 'ceo');
  
  const [projects, setProjects] = useState([]);
  const [selectedDashboardProject, setSelectedDashboardProject] = useState(activeProjectId || '');

  useEffect(() => {
    const fetchProjectsForSelect = async () => {
      const { data, error } = await supabase.from('proyectos').select('uuid_id, nombre, project_type').order('nombre');
      if (error) {
        console.error("Error fetching projects for dashboard select:", error);
      } else {
        setProjects(data || []);
        if (activeProjectId && !data.find(p => p.uuid_id === activeProjectId)) {
          // Active project from context not in list, clear it
          clearActiveProject();
          setSelectedDashboardProject('');
        }
      }
    };
    fetchProjectsForSelect();
  }, [activeProjectId, clearActiveProject]);

  useEffect(() => {
    // Sync local select with context if context changes (e.g. from another page)
    setSelectedDashboardProject(activeProjectId || '');
  }, [activeProjectId]);

  const handleProjectChange = (projectId) => {
    setSelectedDashboardProject(projectId);
    if (projectId) {
      const project = projects.find(p => p.uuid_id === projectId);
      if (project) {
        setCurrentActiveProject(project.uuid_id, project.project_type);
        toast({ title: "Proyecto Activo Cambiado", description: `Ahora estás trabajando en "${project.nombre}".`, variant: "success", icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
      }
    } else {
      clearActiveProject();
      toast({ title: "Proyecto Activo Eliminado", description: "No hay ningún proyecto activo seleccionado.", variant: "info" });
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
        ease: "easeOut"
      }
    })
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
            ¡Hola, <span className="text-primary">{user?.nombre ? user.nombre.split(' ')[0] : 'Usuario'}</span>!
          </h1>
          <p className="text-lg text-muted-foreground mt-1">Bienvenido de nuevo a EVOLTION2020.</p>
        </div>
        {user && <span className="text-md text-muted-foreground self-start md:self-center mt-2 md:mt-0 capitalize">Tu rol: {user.rol}</span>}
      </motion.div>

      {/* Project Selector for Technicians/Workers */}
      {user && (user.rol === 'TECNICO' || user.role === 'worker') && (
        <motion.div 
          className="p-4 border rounded-lg bg-card shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Label htmlFor="active-project-select" className="text-lg font-medium text-foreground">Proyecto Activo Actual:</Label>
          <div className="flex items-center gap-3 mt-2">
            <Select onValueChange={handleProjectChange} value={selectedDashboardProject}>
              <SelectTrigger id="active-project-select" className="flex-grow bg-background border-input">
                <SelectValue placeholder="Selecciona tu proyecto activo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguno (Borrar selección)</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.uuid_id} value={p.uuid_id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeProjectId && <CheckCircle className="h-6 w-6 text-green-500 shrink-0" title={`Proyecto activo: ${projects.find(p=>p.uuid_id === activeProjectId)?.nombre || ''}`} />}
          </div>
          {activeProjectId && activeProjectType && (
            <p className="text-xs text-muted-foreground mt-1">Tipo de proyecto activo: {activeProjectType}</p>
          )}
        </motion.div>
      )}


      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.custom
          variants={actionCardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <ActionCard
            title="Planificación del Día"
            description="Consulta tu proyecto, vehículo, materiales y tareas asignadas para hoy."
            icon={CalendarDays}
            onClick={() => navigate('/planning')}
          />
        </motion.custom>
        <motion.custom
          variants={actionCardVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <ActionCard
            title="Crear Informe Diario"
            description="Registra tus actividades, avances e incidencias de la jornada laboral."
            icon={FilePenLine}
            onClick={() => navigate('/activities?action=new')}
          />
        </motion.custom>
        <motion.custom
          variants={actionCardVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <ActionCard
            title="Chat con ChatEVO"
            description="Tu asistente IA para resolver dudas, buscar documentos y optimizar tareas."
            icon={MessageSquare}
            onClick={() => navigate('/assistant')}
          />
        </motion.custom>
      </div>
      
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
         <StatCard
          title="Proyectos Activos"
          value={isAdminOrCEO ? "12" : (activeProjectId ? "1" : "0")}
          icon={Briefcase}
          color="bg-primary" 
          hoverColor="hsl(var(--primary)/0.3)"
          description={isAdminOrCEO ? "+2 esta semana" : (activeProjectId ? "Asignado a ti" : "Selecciona un proyecto")}
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
        <h2 className="text-2xl font-semibold text-card-foreground mb-4">Actividad Reciente del Equipo</h2>
        <ul className="space-y-3">
          <li className="flex items-center justify-between p-3 bg-secondary/50 rounded-md hover:bg-secondary transition-colors">
            <div>
              <p className="font-medium text-foreground">Nuevo plano subido al Proyecto Alpha</p>
              <p className="text-sm text-muted-foreground">Por <span className="text-primary">Elena Campos</span> - Hace 15 minutos</p>
            </div>
            <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">Ver</Button>
          </li>
          <li className="flex items-center justify-between p-3 bg-secondary/50 rounded-md hover:bg-secondary transition-colors">
            <div>
              <p className="font-medium text-foreground">Tarea "Revisión Estructural" completada en Proyecto Beta</p>
              <p className="text-sm text-muted-foreground">Por <span className="text-primary">Carlos Ruiz</span> - Hace 1 hora</p>
            </div>
            <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">Detalles</Button>
          </li>
        </ul>
      </motion.div>

      {user && (user.role === 'worker' || user.role === 'TECNICO') && (
         <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
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
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
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
