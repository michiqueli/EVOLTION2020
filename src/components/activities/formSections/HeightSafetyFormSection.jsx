import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, Frame as Fence, Milestone, GitCommitHorizontal, Camera, MessageSquare } from 'lucide-react';

const HeightSafetyForm = ({ formData, handleInputChange, isSubmitting }) => {
  return (
    <>
      <div>
        <Label htmlFor="perimeterFenceQuantity" className="text-foreground flex items-center text-md">
          <Fence className="w-5 h-5 mr-2 text-primary" />
          Cantidad de valla perimetral
        </Label>
        <Input 
          name="perimeterFenceQuantity" 
          id="perimeterFenceQuantity" 
          type="number"
          value={formData.perimeterFenceQuantity || ''} 
          onChange={handleInputChange} 
          className="mt-1 bg-background border-input" 
          placeholder="Metros o tramos instalados" 
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="stairsInstalledQuantity" className="text-foreground flex items-center text-md">
          <Milestone className="w-5 h-5 mr-2 text-primary" />
          Cantidad de escaleras instaladas
        </Label>
        <Input 
          name="stairsInstalledQuantity" 
          id="stairsInstalledQuantity" 
          type="number"
          value={formData.stairsInstalledQuantity || ''} 
          onChange={handleInputChange} 
          className="mt-1 bg-background border-input" 
          placeholder="Total de escaleras colocadas" 
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="lifelinesInstalledQuantity" className="text-foreground flex items-center text-md">
          <GitCommitHorizontal className="w-5 h-5 mr-2 text-primary" />
          Cantidad de líneas de vida instaladas
        </Label>
        <Input 
          name="lifelinesInstalledQuantity" 
          id="lifelinesInstalledQuantity" 
          type="number"
          value={formData.lifelinesInstalledQuantity || ''} 
          onChange={handleInputChange} 
          className="mt-1 bg-background border-input" 
          placeholder="Total de líneas de vida instaladas" 
          disabled={isSubmitting}
        />
      </div>
    </>
  );
};

export default HeightSafetyForm;