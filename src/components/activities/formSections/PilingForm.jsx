import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon } from 'lucide-react';

const PilingForm = ({ formData, handleInputChange, isSubmitting }) => {
  return (
    <>
      <div>
        <Label htmlFor="pilesDriven" className="text-foreground">Hincas Realizadas Hoy</Label>
        <Input type="number" name="pilesDriven" id="pilesDriven" value={formData.pilesDriven || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Número de hincas" disabled={isSubmitting}/>
      </div>
      <div>
        <Label htmlFor="predrillingDone" className="text-foreground">Predrilling Realizados Hoy</Label>
        <Input type="number" name="predrillingDone" id="predrillingDone" value={formData.predrillingDone || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Número de predrilling" disabled={isSubmitting}/>
      </div>
      <div>
        <Label htmlFor="pilesDistributed" className="text-foreground">Hincas Repartidas Hoy</Label>
        <Input type="number" name="pilesDistributed" id="pilesDistributed" value={formData.pilesDistributed || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Número de hincas repartidas" disabled={isSubmitting}/>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Agregar Fotos</Label>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file-piling" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-background hover:bg-secondary/50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastrar y soltar</p>
                  <p className="text-xs text-muted-foreground">SVG, PNG, JPG</p>
              </div>
              <Input id="dropzone-file-piling" type="file" className="hidden" multiple disabled={isSubmitting}/>
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

export default PilingForm;