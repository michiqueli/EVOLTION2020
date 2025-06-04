import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HardHat, Briefcase, Users } from 'lucide-react';
import { useUser, ROLES } from '@/contexts/UserContext';

// This page is now optional and not part of the main user flow with LoginPage.
// It can be used for development/testing to quickly switch roles.
// To use it, you might temporarily change the root route in App.jsx or navigate to it directly.

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { loginAsRole } = useUser();

  const handleRoleSelection = (role) => {
    loginAsRole(role); // Uses the simplified loginAsRole from UserContext
    navigate('/dashboard'); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-8">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
        className="mb-12 text-center"
      >
        <h1 className="text-6xl font-extrabold text-primary">
          EVOLTION2020 (Dev Role Selector)
        </h1>
        <p className="mt-3 text-xl text-muted-foreground">
          Selecciona un perfil para simulación rápida.
        </p>
      </motion.div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
        <motion.div
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px hsl(var(--primary)/0.5)" }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Button
            onClick={() => handleRoleSelection(ROLES.WORKER)}
            className="w-full h-auto p-8 text-left bg-card border-2 border-primary/50 hover:border-primary hover:bg-card/90 flex flex-col items-center justify-center space-y-4 rounded-xl shadow-2xl transition-all duration-300"
          >
            <HardHat className="w-16 h-16 text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-card-foreground">Instalador / Técnico</h2>
            <p className="text-sm text-muted-foreground text-center">
              (Simulación)
            </p>
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px hsl(var(--primary)/0.5)" }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Button
            onClick={() => handleRoleSelection(ROLES.SUPERVISOR)}
            className="w-full h-auto p-8 text-left bg-card border-2 border-primary/50 hover:border-primary hover:bg-card/90 flex flex-col items-center justify-center space-y-4 rounded-xl shadow-2xl transition-all duration-300"
          >
            <Users className="w-16 h-16 text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-card-foreground">Supervisor / Líder</h2>
            <p className="text-sm text-muted-foreground text-center">
              (Simulación)
            </p>
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px hsl(var(--primary)/0.5)" }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Button
            onClick={() => handleRoleSelection(ROLES.CEO)} 
            className="w-full h-auto p-8 text-left bg-card border-2 border-primary/50 hover:border-primary hover:bg-card/90 flex flex-col items-center justify-center space-y-4 rounded-xl shadow-2xl transition-all duration-300"
          >
            <Briefcase className="w-16 h-16 text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-card-foreground">CEO / Administrador</h2>
            <p className="text-sm text-muted-foreground text-center">
              (Simulación)
            </p>
          </Button>
        </motion.div>
      </div>
      <motion.p 
        initial={{opacity: 0}}
        animate={{opacity:1}}
        transition={{delay: 0.5, duration:0.5}}
        className="mt-16 text-sm text-muted-foreground"
      >
        Esta página es para selección rápida de roles en desarrollo.
      </motion.p>
    </div>
  );
};

export default RoleSelectionPage;