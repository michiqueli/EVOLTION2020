import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CalendarDays, PenLine as FilePenLine, MessageSquare, Briefcase, AlertTriangle, HardHat, Settings2, Library, BarChart3, ShoppingCart, ShieldAlert, ChevronRight, Users, Bell } from 'lucide-react';
import { useUser, ROLES } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import DashboardActionCard from '@/components/dashboard/DashboardActionCard';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import { supabase } from '@/lib/supabaseClient';

const DashboardPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [isLoadingPendingCount, setIsLoadingPendingCount] = useState(false);


  const isRole = (targetRoles) => {
    if (!user || !user.role) return false;
    return Array.isArray(targetRoles) ? targetRoles.includes(user.role) : user.role === targetRoles;
  };
  
  const fetchPendingUsersCount = useCallback(async () => {
    if (isRole([ROLES.ADMIN, ROLES.CEO, ROLES.DEVELOPER])) {
      setIsLoadingPendingCount(true);
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          throw new Error(sessionError?.message || "No hay sesión activa.");
        }
        const token = sessionData.session.access_token;

        const { data, error } = await supabase.functions.invoke('get-pending-users-count', {
           headers: { Authorization: `Bearer ${token}` }
        });
        if (error) throw error;
        if (data && typeof data.pending_count === 'number') {
          setPendingUsersCount(data.pending_count);
        }
      } catch (e) {
        console.error("Error fetching pending users count:", e);
        // toast({ title: "Error", description: "No se pudo obtener el contador de usuarios pendientes.", variant: "destructive" });
      } finally {
        setIsLoadingPendingCount(false);
      }
    }
  }, [user, toast]); // Ensure user is in dependency array for isRole

  useEffect(() => {
    fetchPendingUsersCount();
  }, [fetchPendingUsersCount]);


  const actionCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1, 
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };
  
  const actionCardsConfig = [
    { 
      title: "Ver Planificación Diaria", 
      description: "Consulta tareas, vehículos y materiales asignados.", 
      icon: CalendarDays, 
      onClick: () => navigate('/planning'),
      roles: [ROLES.WORKER, ROLES.SUPERVISOR, ROLES.CEO, ROLES.ADMIN, ROLES.DEVELOPER]
    },
    { 
      title: "Crear Informe Diario", 
      description: "Registra actividades, avances e incidencias.", 
      icon: FilePenLine, 
      onClick: () => navigate('/activities?action=new'),
      roles: [ROLES.WORKER, ROLES.SUPERVISOR] 
    },
    { 
      title: "Chat con ChatEVO", 
      description: "Asistente IA para dudas y optimización de tareas.", 
      icon: MessageSquare, 
      onClick: () => navigate('/assistant'),
      roles: [ROLES.WORKER, ROLES.SUPERVISOR, ROLES.CEO, ROLES.ADMIN, ROLES.DEVELOPER]
    },
    { 
      title: "Gestionar Proyectos", 
      description: "Crear, editar y administrar proyectos.", 
      icon: Briefcase, 
      onClick: () => navigate('/projects'),
      roles: [ROLES.CEO, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.DEVELOPER]
    },
    { 
      title: "Ver Proyectos Asignados", 
      description: "Consulta información y documentación de tus proyectos.", 
      icon: Briefcase, 
      onClick: () => navigate('/projects'), 
      roles: [ROLES.WORKER] 
    },
    { 
      title: "Biblioteca de Recursos", 
      description: "Accede a manuales, planos y documentación técnica.", 
      icon: Library, 
      onClick: () => navigate('/library'),
      roles: [ROLES.WORKER, ROLES.SUPERVISOR, ROLES.CEO, ROLES.ADMIN, ROLES.DEVELOPER]
    },
    { 
      title: "Generar Reportes Analíticos", 
      description: "Analiza rendimiento, costes y avances.", 
      icon: BarChart3, 
      onClick: () => navigate('/reports'),
      roles: [ROLES.CEO, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.DEVELOPER]
    },
    {
      title: "Revisar Informes de Equipo",
      description: "Aprueba o edita los informes diarios de tus técnicos.",
      icon: FilePenLine,
      onClick: () => navigate('/activities?view=team'), 
      roles: [ROLES.SUPERVISOR]
    },
    {
      title: "Gestión de Usuarios",
      description: "Administrar altas, bajas y roles de usuarios.",
      icon: Users,
      onClick: () => navigate('/admin/users'),
      roles: [ROLES.ADMIN, ROLES.CEO, ROLES.DEVELOPER],
      badge: pendingUsersCount > 0 ? pendingUsersCount.toString() : null,
      badgeColor: 'bg-yellow-500 text-white',
    }
  ];

  const visibleActionCards = actionCardsConfig.filter(card => isRole(card.roles));

  const upcomingFeaturesConfig = [
     { 
      title: "Solicitar Compra", 
      icon: ShoppingCart, 
      onClick: () => toast({ title: "Próximamente", description: "Funcionalidad de Solicitud de Compra estará disponible pronto."}),
      roles: [ROLES.WORKER, ROLES.SUPERVISOR]
    },
    { 
      title: "Reportar Incidente", 
      icon: ShieldAlert, 
      onClick: () => toast({ title: "Próximamente", description: "Funcionalidad de Reporte de Incidente estará disponible pronto."}),
      roles: [ROLES.WORKER, ROLES.SUPERVISOR]
    },
  ];

  const visibleUpcomingFeatures = upcomingFeaturesConfig.filter(feature => isRole(feature.roles));

  return (
    <div className="space-y-8 p-2 md:p-4">
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            ¡Hola, <span className="text-primary">{user?.name ? user.name.split(' ')[0] : 'Usuario'}</span>!
          </h1>
          <p className="text-md md:text-lg text-muted-foreground mt-1">Bienvenido de nuevo a EVOLTION2020.</p>
        </div>
        {user && <span className="text-sm md:text-md text-muted-foreground self-start md:self-center mt-2 md:mt-0 capitalize bg-secondary px-2 py-1 rounded">Rol: {user.role}</span>}
      </motion.div>
      
      {isRole([ROLES.ADMIN, ROLES.CEO, ROLES.DEVELOPER]) && pendingUsersCount > 0 && !isLoadingPendingCount && (
         <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 mb-6 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-lg shadow-lg flex items-center justify-between cursor-pointer hover:from-yellow-500 hover:to-orange-600 transition-all"
            onClick={() => navigate('/admin/users')}
          >
            <div className="flex items-center">
              <Bell className="h-6 w-6 mr-3 animate-pulse" />
              <p className="font-semibold text-lg">
                Hay {pendingUsersCount} nuevo{pendingUsersCount > 1 ? 's' : ''} usuario{pendingUsersCount > 1 ? 's' : ''} pendiente{pendingUsersCount > 1 ? 's' : ''} de aprobación.
              </p>
            </div>
            <ChevronRight className="h-6 w-6" />
        </motion.div>
      )}


      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleActionCards.map((card, index) => (
           <motion.div
            key={card.title}
            variants={actionCardVariants}
            initial="hidden"
            animate="visible"
            custom={index}
            className="h-full" 
          >
            <DashboardActionCard
              title={card.title}
              description={card.description}
              icon={card.icon}
              onClick={card.onClick}
              className="flex flex-col h-full"
              badge={card.badge}
              badgeColor={card.badgeColor}
            />
          </motion.div>
        ))}
      </div>
      
      {visibleUpcomingFeatures.length > 0 && (
        <motion.div 
          className="mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: visibleActionCards.length * 0.1 }}
        >
          <h2 className="text-2xl font-semibold text-foreground mb-3 flex items-center">
            <ChevronRight className="h-6 w-6 text-primary mr-1"/> Próximamente...
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleUpcomingFeatures.map((feature) => (
              <Button 
                key={feature.title} 
                variant="outline" 
                className="justify-start p-4 h-auto border-dashed hover:border-primary hover:bg-primary/5 group transition-all"
                onClick={feature.onClick}
              >
                <feature.icon className="h-7 w-7 text-primary/70 mr-3 group-hover:text-primary transition-colors" />
                <div>
                  <p className="font-medium text-foreground text-left">{feature.title}</p>
                  <p className="text-xs text-muted-foreground text-left">Esta función estará disponible pronto.</p>
                </div>
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
            title="Alertas Críticas"
            value={isRole([ROLES.CEO, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.DEVELOPER]) ? "3" : "0"}
            icon={AlertTriangle}
            color="bg-destructive"
            hoverColor="hsl(var(--destructive)/0.3)"
            description="Requieren atención inmediata"
            isVisible={isRole([ROLES.CEO, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.DEVELOPER])}
        />
      </div>
      
      <motion.div
        className="mt-10 rounded-xl border border-border bg-card p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: (visibleActionCards.length * 0.1) + 0.2 }}
        style={{ display: isRole([ROLES.CEO, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.DEVELOPER]) ? 'block' : 'none' }} 
      >
        <h2 className="text-2xl font-semibold text-card-foreground mb-4">
          {isRole([ROLES.CEO, ROLES.ADMIN, ROLES.DEVELOPER]) ? "Actividad Reciente General" : "Actividad Reciente del Equipo"}
        </h2>
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

      {isRole(ROLES.WORKER) && (
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
            onClick={() => toast({ title: "Modo Obra", description: "Interfaz simplificada activada (conceptual)."})}
          >
            <HardHat className="h-7 w-7" />
          </Button>
        </motion.div>
      )}

      {isRole([ROLES.CEO, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.DEVELOPER]) && ( 
         <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
          className="fixed bottom-6 right-6 z-50 print:hidden"
        >
          <Button
            size="lg"
            className="rounded-full shadow-2xl bg-secondary text-secondary-foreground hover:bg-secondary/80 w-16 h-16 p-0 flex items-center justify-center"
            title={isRole([ROLES.CEO, ROLES.ADMIN, ROLES.DEVELOPER]) ? "Configuración Global" : "Ajustes de Supervisor"}
            onClick={() => {
              if (isRole([ROLES.CEO, ROLES.ADMIN, ROLES.DEVELOPER])) {
                navigate('/admin/settings');
              } else {
                 toast({ title: "Ajustes de Supervisor", description: "Página de ajustes para supervisores (conceptual)."});
              }
            }}
          >
            <Settings2 className="h-7 w-7" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;