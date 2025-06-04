import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Shield, Bell, Edit3 } from 'lucide-react';
import { useUser, ROLES } from '@/contexts/UserContext'; // Import ROLES as well

const ProfilePage = () => {
  const { user, updateUserRole } = useUser(); // Get user and updateUserRole from context

  if (!user) {
    return ( // Or a loading spinner, or redirect to login
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  // Demo function to cycle roles for testing
  const cycleRole = () => {
    const rolesArray = [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR, ROLES.WORKER]; // Use ROLES constants
    const currentIndex = rolesArray.indexOf(user.role);
    const nextIndex = (currentIndex + 1) % rolesArray.length;
    if (user && user.id) {
      updateUserRole(user.id, rolesArray[nextIndex]);
    }
  };


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-2xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-primary text-center">Perfil y Configuración</h1>
      
      <div className="rounded-xl border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-6">
          <Avatar className="h-32 w-32 border-4 border-primary shadow-lg">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-4xl">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-card-foreground">{user.name}</h2>
            <p className="text-primary">{user.email}</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity duration-300 shadow-lg">
            <Edit3 className="mr-2 h-4 w-4" />
            Editar Perfil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <motion.div 
          className="rounded-xl border border-border bg-card p-6 shadow-lg"
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px hsl(var(--primary)/0.1), 0 4px 6px -2px hsl(var(--primary)/0.05)" }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <User className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold text-card-foreground">Datos del Usuario</h3>
          </div>
          <p className="text-sm text-muted-foreground">Nombre: {user.name}</p>
          <p className="text-sm text-muted-foreground">Email: {user.email}</p>
          {/* <p className="text-sm text-muted-foreground">Teléfono: +12 345 67890</p> */}
        </motion.div>

        <motion.div 
          className="rounded-xl border border-border bg-card p-6 shadow-lg"
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px hsl(var(--primary)/0.1), 0 4px 6px -2px hsl(var(--primary)/0.05)" }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold text-card-foreground">Rol Actual</h3>
          </div>
          <p className="text-lg font-medium text-green-400 capitalize">{user.role}</p>
          <p className="text-sm text-muted-foreground">
            {user.role === ROLES.ADMIN && "Acceso completo al sistema."}
            {user.role === ROLES.CEO && "Acceso de dirección y gestión total."}
            {user.role === ROLES.SUPERVISOR && "Acceso de supervisión de equipo y proyectos."}
            {user.role === ROLES.WORKER && "Acceso a tareas y actividades asignadas."}
          </p>
           {/* Button to cycle role for demo purposes */}
           <Button variant="outline" size="sm" onClick={cycleRole} className="mt-3">Cambiar Rol (Demo)</Button>
        </motion.div>
      </div>

      <motion.div 
        className="rounded-xl border border-border bg-card p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-3 mb-3">
          <Bell className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold text-card-foreground">Notificaciones</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Notificaciones por email</p>
            {/* Switch component would be needed here */}
            <span className="text-sm text-green-400">Activado</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Alertas de proyecto</p>
            <span className="text-sm text-green-400">Activado</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Resumenes semanales</p>
            <span className="text-sm text-muted-foreground">Desactivado</span>
          </div>
        </div>
        <Button variant="outline" className="mt-4">Administrar Preferencias</Button>
      </motion.div>

    </motion.div>
  );
};

export default ProfilePage;