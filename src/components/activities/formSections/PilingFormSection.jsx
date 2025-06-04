
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const PilingFormSection = ({ formData, handleInputChange, disabled }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <div>
      <Label htmlFor="hincas" className="text-foreground">Hincas Realizadas</Label>
      <Input 
        type="number" 
        name="hincas" 
        id="hincas" 
        value={formData.hincas || ''} 
        onChange={handleInputChange} 
        className="mt-1 bg-background border-input" 
        placeholder="Número de hincas" 
        disabled={disabled} 
      />
    </div>
    <div>
      <Label htmlFor="predrilling" className="text-foreground">Predrilling</Label>
      <Input 
        type="number" 
        name="predrilling" 
        id="predrilling" 
        value={formData.predrilling || ''} 
        onChange={handleInputChange} 
        className="mt-1 bg-background border-input" 
        placeholder="Cantidad" 
        disabled={disabled} 
      />
    </div>
    <div>
      <Label htmlFor="reparto_hincas" className="text-foreground">Reparto de Hincas</Label>
      <Input 
        type="number" 
        name="reparto_hincas" 
        id="reparto_hincas" 
        value={formData.reparto_hincas || ''} 
        onChange={handleInputChange} 
        className="mt-1 bg-background border-input" 
        placeholder="Cantidad" 
        disabled={disabled} 
      />
    </div>
  </div>
);

export default PilingFormSection;