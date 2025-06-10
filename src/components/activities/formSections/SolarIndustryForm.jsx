import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';

const SolarIndustryForm = ({ formData, handleInputChange, isSubmitting }) => {
  return (
    <>
      <div>
        <Label htmlFor="platesInstalled" className="text-foreground">Placas Instaladas Hoy</Label>
        <Input type="number" name="platesInstalled" id="platesInstalled" value={formData.platesInstalled || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Cantidad" disabled={isSubmitting}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="structureMounted" className="text-foreground">Estructura Montada</Label>
          <Input type="text" name="structureMounted" id="structureMounted" value={formData.structureMounted || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Ej: 10kW o 5 módulos" disabled={isSubmitting}/>
        </div>
        <div>
          <Label htmlFor="cablePulled" className="text-foreground">Metros de Cable Tirados</Label>
          <Input type="number" name="cablePulled" id="cablePulled" value={formData.cablePulled || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Metros" disabled={isSubmitting}/>
        </div>
      </div>
      <div>
        <Label htmlFor="channelingDone" className="text-foreground">Metros de Canalización Realizados</Label>
        <Input type="number" name="channelingDone" id="channelingDone" value={formData.channelingDone || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Metros" disabled={isSubmitting}/>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Agregar Fotos</Label>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file-solarIndustry" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-background hover:bg-secondary/50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastrar y soltar</p>
                  <p className="text-xs text-muted-foreground">SVG, PNG, JPG</p>
              </div>
              <Input id="dropzone-file-solarIndustry" type="file" className="hidden" multiple disabled={isSubmitting} />
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

export default SolarIndustryForm;