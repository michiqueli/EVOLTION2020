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
      
      <div className="space-y-2">
        <Label className="text-foreground flex items-center text-md">
          <Camera className="w-5 h-5 mr-2 text-blue-500" />
          Fotografías
        </Label>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file-heightSafety" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-background hover:bg-secondary/50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastrar y soltar</p>
                  <p className="text-xs text-muted-foreground">SVG, PNG, JPG</p>
              </div>
              <Input 
                id="dropzone-file-heightSafety" 
                name="photos"
                type="file" 
                className="hidden" 
                multiple 
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="comment" className="text-foreground flex items-center text-md">
          <MessageSquare className="w-5 h-5 mr-2 text-gray-500" />
          Comentarios adicionales
        </Label>
        <Textarea 
          name="comment" 
          id="comment" 
          value={formData.comment || ''} 
          onChange={handleInputChange} 
          className="mt-1 bg-background border-input min-h-[100px]" 
          placeholder="Observaciones adicionales sobre la actividad..." 
          disabled={isSubmitting}
        />
      </div>
    </>
  );
};

export default HeightSafetyForm;