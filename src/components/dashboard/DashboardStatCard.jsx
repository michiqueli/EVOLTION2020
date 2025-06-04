import React from 'react';
import { motion } from 'framer-motion';

const DashboardStatCard = ({ title, value, icon, color, description, hoverColor, isVisible = true }) => {
  if (!isVisible) return null;
  return (
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
};

export default DashboardStatCard;