
import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import YesNoQuestion from '@/components/activities/YesNoQuestion';
import { useToast } from "@/components/ui/use-toast";

const SolarDomesticFormSection = ({ formData, handleRadioChange, handleInputChange, disabled }) => {
  const { toast } = useToast();
  return (
    <>
      <YesNoQuestion 
        name="finalizado" 
        label="¿Se terminó la instalación?" 
        value={formData.finalizado} 
        onChange={handleRadioChange} 
        disabled={disabled} 
      />
      {formData.finalizado === 'yes' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          className="space-y-4 pl-4 border-l-2 border-primary/50"
        >
          <YesNoQuestion 
            name="todo_recogido" 
            label="¿Está todo recogido?" 
            value={formData.todo_recogido} 
            onChange={handleRadioChange} 
            disabled={disabled} 
          />
          <YesNoQuestion 
            name="quedo_algo_en_cubierta" 
            label="¿En la cubierta no queda nada?" 
            value={formData.quedo_algo_en_cubierta} 
            onChange={handleRadioChange} 
            disabled={disabled} 
          />
          <YesNoQuestion 
            name="app_funciona" 
            label="¿La app está funcionando?" 
            value={formData.app_funciona} 
            onChange={handleRadioChange} 
            disabled={disabled} 
          />
          <YesNoQuestion 
            name="cliente_contento" 
            label="¿El cliente está contento?" 
            value={formData.cliente_contento} 
            onChange={handleRadioChange} 
            disabled={disabled} 
          />
        </motion.div>
      )}
      {formData.finalizado === 'no' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          className="space-y-4 pl-4 border-l-2 border-destructive/50"
        >
          <YesNoQuestion 
            name="faltan_materiales" 
            label="¿Faltan materiales para mañana?" 
            value={formData.faltan_materiales} 
            onChange={handleRadioChange} 
            disabled={disabled} 
          />
          {formData.faltan_materiales === 'yes' && (
            <div className="space-y-1">
              <Label htmlFor="faltan_materiales_detalles" className="text-foreground">¿Qué materiales faltan?</Label>
              <Textarea 
                name="faltan_materiales_detalles" 
                id="faltan_materiales_detalles" 
                value={formData.faltan_materiales_detalles || ''} 
                onChange={handleInputChange} 
                className="mt-1 bg-background border-input min-h-[80px]" 
                placeholder="Detalla los materiales..." 
                disabled={disabled} 
              />
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                className="mt-2 border-primary text-primary hover:bg-primary/10" 
                onClick={() => toast({title: "Funcionalidad Próximamente"})}
                disabled={disabled}
              >
                <Send className="mr-2 h-4 w-4" /> Solicitar Compra
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
};

export default SolarDomesticFormSection;