
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const ActivityBranchSelector = ({ branches, onSelect, onCancel }) => {
  if (!branches || !Array.isArray(branches)) {
    console.error('ActivityBranchSelector: branches prop is required and must be an array');
    return null;
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
          <h2 className="text-2xl font-semibold text-primary">Selecciona el Tipo de Trabajo</h2>
          {onCancel && (
            <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground hover:text-destructive">
                <X className="h-5 w-5" />
            </Button>
          )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {branches.map(branch => (
          <motion.button
            key={branch.id}
            whileHover={{ y: -5, boxShadow: "0px 8px 15px hsla(var(--primary-values)/0.1)" }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={() => onSelect(branch.id)}
            className="flex flex-col items-center justify-center space-y-2 p-6 bg-background hover:bg-secondary/50 border border-input rounded-lg text-center cursor-pointer h-36"
          >
            {React.createElement(branch.icon, { className: "h-8 w-8 text-primary" })}
            <span className="text-foreground font-medium">{branch.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default ActivityBranchSelector;