import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DraggableTaskItem = React.memo(({ id, title, icon: Icon, onDragStart, onDragEnd }) => (
  <motion.div
    layoutId={`task-${id}-available`} 
    id={id}
    drag
    dragElastic={0.1}
    whileDrag={{ scale: 1.05, zIndex: 1000, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)" }}
    onDragStart={() => onDragStart(id)}
    onDragEnd={() => onDragEnd(id)} 
    className="flex items-center space-x-2 p-3 bg-card rounded-lg shadow-md hover:shadow-lg cursor-grab border border-border active:cursor-grabbing"
  >
    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab flex-shrink-0" />
    <Icon className="h-5 w-5 text-primary flex-shrink-0" />
    <span className="text-sm font-medium text-foreground flex-grow truncate">{title}</span>
  </motion.div>
));


export const AvailableTasksPanel = React.memo(({ tasks, onDragStart, onDragEnd, isOpen, setIsOpen }) => {
  
  return (
    <div className="lg:col-span-3 bg-card border border-border rounded-lg p-3 md:p-4 shadow-sm flex flex-col h-full lg:h-auto">
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className="lg:hidden w-full mb-3 flex items-center justify-between bg-primary/10 hover:bg-primary/20 text-primary"
        variant="outline"
      >
        <div className="flex items-center">
          <Briefcase className="mr-2 h-5 w-5" />
          Obras / Tareas Pendientes
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </Button>
      <h2 className="text-lg font-semibold text-primary mb-3 border-b pb-2 hidden lg:flex items-center">
        <Briefcase className="mr-2 h-5 w-5" />
        Obras / Tareas Pendientes
      </h2>
      <div className={`space-y-3 overflow-y-auto flex-grow pr-1 ${isOpen ? 'block' : 'hidden'} lg:block`}>
        {tasks.map(task => (
          <DraggableTaskItem
            key={task.id}
            id={task.id}
            title={task.title}
            icon={task.icon || Briefcase}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay tareas pendientes.</p>}
      </div>
    </div>
  );
});