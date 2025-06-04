import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const DashboardActionCard = ({ title, description, icon: Icon, onClick, className, badge, badgeColor }) => {
  return (
    <motion.div
      className={cn(
        "relative group bg-card border border-border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
        className
      )}
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300 } }}
    >
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 group-hover:border-primary/40 transition-colors">
            <Icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
          </div>
          {badge && (
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-semibold",
              badgeColor || "bg-primary text-primary-foreground"
            )}>
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 flex-grow">{description}</p>
        <Button 
          variant="ghost" 
          onClick={onClick} 
          className="mt-auto self-start text-primary hover:text-primary hover:bg-primary/10 px-0 py-1 h-auto group-hover:translate-x-1 transition-transform"
        >
          <span className="font-medium">Comenzar ahora</span>
          <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary/50 to-secondary/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-left" />
    </motion.div>
  );
};

export default DashboardActionCard;