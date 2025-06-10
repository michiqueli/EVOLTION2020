import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Sun, Home, ShieldAlert, Hammer } from 'lucide-react';

export const activityBranches = [
  { id: 'solarIndustry', name: 'Placas solares - Industria', icon: Sun, projectTypes: ['Placas solares - Industria'] },
  { id: 'solarDomestic', name: 'Placas solares - Doméstica', icon: Home, projectTypes: ['Placas solares - Doméstica'] },
  { id: 'heightSafety', name: 'Seguridad en altura', icon: ShieldAlert, projectTypes: ['Seguridad en altura'] },
  { id: 'piling', name: 'Hincado', icon: Hammer, projectTypes: ['Hincado'] },
  // Consider a generic branch if project type doesn't match specific ones or allow all if no project type filter
];

const BranchSelection = ({ onSelectBranch, onCancel, currentProjectName, currentProjectType }) => {
  
  const availableBranches = currentProjectType 
    ? activityBranches.filter(branch => branch.projectTypes.includes(currentProjectType) || !branch.projectTypes) // Show branches matching project type or generic branches
    : activityBranches; // Show all if no project type

  if (availableBranches.length === 1 && currentProjectType) {
    // If only one specific branch matches the project type, auto-select it.
    // This is a potential further optimization. For now, let's always show selection.
    // useEffect(() => { onSelectBranch(availableBranches[0].id); }, [onSelectBranch, availableBranches]);
    // return null; // Or a loading indicator
  }


  return (
    <motion.div
      key="branchSelection"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-card p-6 sm:p-8 rounded-xl shadow-2xl border border-border"
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Selecciona el Tipo de Trabajo</h2>
          {currentProjectName && <p className="text-sm text-muted-foreground">Proyecto: {currentProjectName}</p>}
          {currentProjectType && <p className="text-xs text-muted-foreground">Tipo: {currentProjectType}</p>}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground hover:text-destructive">
          <X className="h-5 w-5" />
        </Button>
      </div>
      {availableBranches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableBranches.map(branch => (
            <motion.button
              key={branch.id}
              whileHover={{ y: -5, boxShadow: "0px 8px 15px hsla(var(--primary-values)/0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => onSelectBranch(branch.id)}
              className="flex flex-col items-center justify-center space-y-2 p-6 bg-background hover:bg-secondary/50 border border-input rounded-lg text-center cursor-pointer h-36"
            >
              {React.createElement(branch.icon, { className: "h-8 w-8 text-primary" })}
              <span className="text-foreground font-medium">{branch.name}</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">No hay tipos de trabajo específicos definidos para el tipo de proyecto "{currentProjectType}". Contacte a un administrador.</p>
      )}
    </motion.div>
  );
};

export default BranchSelection;