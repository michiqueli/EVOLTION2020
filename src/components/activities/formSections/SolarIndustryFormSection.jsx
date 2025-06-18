import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon } from 'lucide-react';

const SolarIndustryForm = ({ formData, handleInputChange, isSubmitting }) => {
  return (
    <>
      <div>
        <Label htmlFor="platesInstalled" className="text-foreground">Placas Instaladas</Label>
        <Input type="number" name="platesInstalled" id="platesInstalled" value={formData.platesInstalled || ''} onChange={handleInputChange} className="mt-1 bg-background border-input" placeholder="Cantidad" disabled={isSubmitting}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="structureMounted" className="text-foreground">Estructuras Montadas</Label>
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
    </>
  );
};

export default SolarIndustryForm;