import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import YesNoQuestion from '@/components/activities/YesNoQuestion';
import { Image as ImageIcon, Send } from 'lucide-react';

const SolarDomesticForm = ({ formData, handleInputChange, handleRadioChange, isSubmitting }) => {
  return (
    <>
      <div>
        <Label htmlFor="platesInstalled" className="text-foreground">Placas Instaladas Hoy</Label>
        <Input type="number" name="platesInstalled" id="platesInstalled" value={formData.platesInstalled || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Cantidad" disabled={isSubmitting}/>
      </div>
      <YesNoQuestion name="installationFinished" label="¿Se terminó la instalación?" value={formData.installationFinished} onChange={handleRadioChange} disabled={isSubmitting} />
      {formData.installationFinished === 'yes' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pl-4 border-l-2 border-primary/50">
          <YesNoQuestion name="allCollected" label="¿Está todo recogido?" value={formData.allCollected} onChange={handleRadioChange} disabled={isSubmitting}/>
          <YesNoQuestion name="deckClear" label="¿En la cubierta no queda nada?" value={formData.deckClear} onChange={handleRadioChange} disabled={isSubmitting}/>
          <YesNoQuestion name="appWorking" label="¿La app está funcionando?" value={formData.appWorking} onChange={handleRadioChange} disabled={isSubmitting}/>
          <YesNoQuestion name="clientHappy" label="¿El cliente está contento?" value={formData.clientHappy} onChange={handleRadioChange} disabled={isSubmitting}/>
        </motion.div>
      )}
      {formData.installationFinished === 'no' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pl-4 border-l-2 border-destructive/50">
          <YesNoQuestion name="missingMaterialsTomorrow" label="¿Faltan materiales para mañana?" value={formData.missingMaterialsTomorrow} onChange={handleRadioChange} disabled={isSubmitting}/>
          {formData.missingMaterialsTomorrow === 'yes' && (
            <div className="space-y-1">
              <Label htmlFor="missingMaterialsDetails" className="text-foreground">¿Qué materiales faltan?</Label>
              <Textarea name="missingMaterialsDetails" id="missingMaterialsDetails" value={formData.missingMaterialsDetails || ''} onChange={handleInputChange} className="mt-1 bg-background border-input min-h-[80px]" placeholder="Detalla los materiales..." disabled={isSubmitting}/>
              <Button type="button" size="sm" variant="outline" className="mt-2 border-primary text-primary hover:bg-primary/10" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" /> Solicitar Compra (Conceptual)
              </Button>
            </div>
          )}
        </motion.div>
      )}
      <div className="space-y-2">
        <Label className="text-foreground">Agregar Fotos</Label>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file-solarDomestic" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-background hover:bg-secondary/50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastrar y soltar</p>
                  <p className="text-xs text-muted-foreground">SVG, PNG, JPG</p>
              </div>
              <Input id="dropzone-file-solarDomestic" type="file" className="hidden" multiple disabled={isSubmitting}/>
          </label>
        </div>
      </div>
      <div>
        <Label htmlFor="comment" className="text-foreground">Comentario Libre</Label>
        <Textarea name="comment" id="comment" value={formData.comment || ''} onChange={handleInputChange} className="mt-1 bg-background border-input min-h-[100px]" placeholder="Añade cualquier nota o comentario adicional..." disabled={isSubmitting}/>
      </div>
    </>
  );
};

export default SolarDomesticForm;