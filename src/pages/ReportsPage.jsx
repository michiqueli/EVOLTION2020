import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const ReportsPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Reportes / Análisis</h1>
        <Button className="bg-gradient-to-r from-primary to-blue-400 text-primary-foreground hover:opacity-90 transition-opacity duration-300 shadow-lg">
          <Download className="mr-2 h-5 w-5" />
          Exportar
        </Button>
      </div>
      <p className="text-muted-foreground">Visualiza gráficas de rendimiento y análisis detallados.</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">Rendimiento por Proyecto</h2>
          <div className="h-64 rounded bg-secondary/30 flex items-center justify-center">
            <p className="text-muted-foreground">Gráfica aquí</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">Productividad por Empleado</h2>
           <div className="h-64 rounded bg-secondary/30 flex items-center justify-center">
            <p className="text-muted-foreground">Gráfica aquí</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-lg md:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">Costo por Tarea</h2>
           <div className="h-64 rounded bg-secondary/30 flex items-center justify-center">
            <p className="text-muted-foreground">Gráfica aquí</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportsPage;