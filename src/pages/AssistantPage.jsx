import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Mic, MessageSquare } from 'lucide-react'; // MessageSquare as ChatEVO icon
// import { Input } from '@/components/ui/input'; // Assuming shadcn Input exists or will be created

const AssistantPage = () => {
  const suggestedActions = [
    "Ver planos del Proyecto X",
    "Subir nueva actividad de obra",
    "Buscar manual de instalación de equipo Y",
    "Mostrar resumen de progreso semanal"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-[calc(100vh-10rem)] flex-col"
    >
      <div className="flex items-center mb-6">
        <MessageSquare className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-3xl font-bold text-primary">ChatEVO</h1>
      </div>
      
      <div className="flex-grow overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-inner space-y-4">
        <div className="flex justify-start">
          <div className="max-w-xs rounded-lg bg-secondary p-3 lg:max-w-md">
            <p className="text-sm text-secondary-foreground">Hola, soy ChatEVO. ¿En qué puedo ayudarte hoy?</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-xs rounded-lg bg-primary p-3 lg:max-w-md">
            <p className="text-sm text-primary-foreground">Necesito los planos del Proyecto Alpha.</p>
          </div>
        </div>
         <div className="flex justify-start">
          <div className="max-w-xs rounded-lg bg-secondary p-3 lg:max-w-md">
            <p className="text-sm text-secondary-foreground">Claro, aquí tienes los planos del Proyecto Alpha. ¿Algo más?</p>
            <Button variant="link" size="sm" className="text-primary p-0 h-auto mt-1 hover:text-primary/80">Ver Planos_Alpha.pdf</Button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          {suggestedActions.map((action, index) => (
            <Button key={index} variant="outline" size="sm" className="text-xs border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
              {action}
            </Button>
          ))}
        </div>
        <div className="flex items-center space-x-2 rounded-lg border border-border bg-card p-2 shadow-md">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Paperclip className="h-5 w-5" />
          </Button>
          <input 
            type="text"
            placeholder="Escribe tu pregunta o directiva..."
            className="flex-grow bg-transparent p-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none"
          />
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Mic className="h-5 w-5" />
          </Button>
          <Button size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity duration-300">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default AssistantPage;