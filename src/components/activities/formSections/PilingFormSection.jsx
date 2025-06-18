import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon } from 'lucide-react';

const PilingForm = ({ formData, handleInputChange, isSubmitting }) => {
  return (
    <>
      <div>
        <Label htmlFor="pilesDriven" className="text-foreground">Cantidad: Hincas realizadas</Label>
        <Input type="number" name="pilesDriven" id="pilesDriven" value={formData.pilesDriven || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Cantidad en Unidades (Solo números)" disabled={isSubmitting}/>
      </div>
      <div>
        <Label htmlFor="predrillingDone" className="text-foreground">Cantidad: Predrilling Realizados</Label>
        <Input type="number" name="predrillingDone" id="predrillingDone" value={formData.predrillingDone || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Cantidad en Unidades (Solo números)" disabled={isSubmitting}/>
      </div>
      <div>
        <Label htmlFor="pilesDistributed" className="text-foreground">Cantidad: Reparto de hincas</Label>
        <Input type="number" name="pilesDistributed" id="pilesDistributed" value={formData.pilesDistributed || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Cantidad en Unidades (Solo números)" disabled={isSubmitting}/>
      </div>
    </>
  );
};

export default PilingForm;