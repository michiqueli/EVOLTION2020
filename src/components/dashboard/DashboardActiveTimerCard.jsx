import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from "@/components/ui/progress";
import { Play, StopCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const ActiveTimerCard = ({
  projects,
  activeProjectId,
  onProjectChange,
  isTimerActive,
  onStartTimer,
  onStopTimer,
  elapsedTime,
  weeklyHours,
  weeklyGoal,
}) => {
  const currentDate = format(new Date(), "d 'de' MMMM", { locale: es });
  const progressPercentage = Math.min(100, (weeklyHours / weeklyGoal) * 100);

  return (
    <motion.div
      layout
      className="bg-card text-card-foreground rounded-2xl shadow-lg p-6 border w-full max-w-sm mx-auto"
    >
      <div className="flex justify-between items-center">
        <div className="text-center">
          <p className="text-muted-foreground text-xl">{currentDate}</p>
          <p className="text-muted-foreground text-lg">Proyecto</p>
          <Select value={activeProjectId || ""} onValueChange={onProjectChange} disabled={isTimerActive}>
            <SelectTrigger className="text-md font-bold p-0 h-auto border-0 shadow-none focus:ring-0 bg-transparent">
              <SelectValue placeholder="Seleccionar Proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.uuid_id} value={p.uuid_id}>{p.nombre}</SelectItem>
              ))}
              <SelectItem value="OTROS">OTROS (No listado)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={isTimerActive ? onStopTimer : onStartTimer} size="icon" className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg">
          {isTimerActive ? <StopCircle className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </Button>
      </div>

      <div className="text-center my-4">
        <div className="flex items-center justify-center gap-2 text-4xl font-mono tracking-tighter">
          <Clock className={cn("h-8 w-8 transition-colors", isTimerActive ? "text-primary" : "text-muted-foreground")} />
          <span>{elapsedTime}</span>
          {isTimerActive && <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>}
        </div>
      </div>

      <div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>Esta semana</span>
          <span>{weeklyHours.toFixed(2)}h / {weeklyGoal}h</span>
        </div>
      </div>
    </motion.div>
  );
};