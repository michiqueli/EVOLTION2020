import React from 'react';
import { motion } from 'framer-motion';

const LibraryPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-primary">Biblioteca</h1>
      <p className="text-muted-foreground">Accede a documentos técnicos, manuales y más.</p>

      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">El contenido de la biblioteca aparecerá aquí.</p>
        <p className="text-sm text-muted-foreground">Incluirá documentos, manuales por categoría, búsqueda inteligente y favoritos.</p>
      </div>
    </motion.div>
  );
};

export default LibraryPage;