
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const SolarIndustryFormSection = ({ formData, handleInputChange, disabled }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <div>
      <Label htmlFor="placas_instaladas" className="text-foreground">Placas Instaladas Hoy</Label>
      <Input 
        type="number" 
        name="placas_instaladas" 
        id="placas_instaladas" 
        value={formData.placas_instaladas || ''} 
        onChange={handleInputChange} 
        className="mt-1 bg-background border-input" 
        placeholder="Cantidad" 
        disabled={disabled}
      />
    </div>
    <div>
      <Label htmlFor="estructura_montada" className="text-foreground">Estructura Montada</Label>
      <Input 
        type="text" 
        name="estructura_montada" 
        id="estructura_montada" 
        value={formData.estructura_montada || ''} 
        onChange={handleInputChange} 
        className="mt-1 bg-background border-input" 
        placeholder="Ej: 10kW o 5 módulos" 
        disabled={disabled}
      />
    </div>
    <div>
      <Label htmlFor="metros_cable" className="text-foreground">Metros de Cable Tirados</Label>
      <Input 
        type="number" 
        name="metros_cable" 
        id="metros_cable" 
        value={formData.metros_cable || ''} 
        onChange={handleInputChange} 
        className="mt-1 bg-background border-input" 
        placeholder="Metros" 
        disabled={disabled}
      />
    </div>
  </div>
);

export default SolarIndustryFormSection;