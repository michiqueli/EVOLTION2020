
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import YesNoQuestion from '@/components/activities/YesNoQuestion';

const HeightSafetyFormSection = ({ formData, handleRadioChange, handleInputChange, disabled }) => (
  <>
    <YesNoQuestion 
      name="equipo_proteccion_revisado" 
      label="¿Equipo de protección revisado?" 
      value={formData.equipo_proteccion_revisado} 
      onChange={handleRadioChange} 
      disabled={disabled} 
    />
    <YesNoQuestion 
      name="lineas_vida_aseguradas" 
      label="¿Líneas de vida aseguradas?" 
      value={formData.lineas_vida_aseguradas} 
      onChange={handleRadioChange} 
      disabled={disabled} 
    />
    <YesNoQuestion 
      name="area_trabajo_desp_señal" 
      label="¿Área de trabajo despejada y señalizada?" 
      value={formData.area_trabajo_desp_señal} 
      onChange={handleRadioChange} 
      disabled={disabled} 
    />
    <div>
      <Label htmlFor="observaciones_seguridad" className="text-foreground">Observaciones de Seguridad Adicionales</Label>
      <Textarea 
        name="observaciones_seguridad" 
        id="observaciones_seguridad" 
        value={formData.observaciones_seguridad || ''} 
        onChange={handleInputChange} 
        className="mt-1 bg-background border-input min-h-[100px]" 
        placeholder="Cualquier detalle relevante sobre seguridad..." 
        disabled={disabled} 
      />
    </div>
  </>
);

export default HeightSafetyFormSection;