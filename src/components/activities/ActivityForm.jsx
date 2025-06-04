
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ClipboardList, Briefcase, Loader } from 'lucide-react';
import FileUploadSection from '@/components/activities/FileUploadSection';
import SolarDomesticFormSection from '@/components/activities/formSections/SolarDomesticFormSection';
import SolarIndustryFormSection from '@/components/activities/formSections/SolarIndustryFormSection';
import HeightSafetyFormSection from '@/components/activities/formSections/HeightSafetyFormSection';
import PilingFormSection from '@/components/activities/formSections/PilingFormSection';

const ActivityForm = ({
  selectedBranch,
  activityBranches,
  formData,
  availableProjects,
  filePreviews,
  isUploading,
  handleInputChange,
  handleRadioChange,
  handleProjectSelectChange,
  handleFileChange,
  removeFile,
  handleSubmit,
  onCancel,
}) => {
  const currentBranchInfo = activityBranches.find(b => b.id === selectedBranch);

  return (
    <motion.form
      key={selectedBranch}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className="space-y-6 bg-card p-6 sm:p-8 rounded-xl shadow-2xl border border-border"
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold text-primary flex items-center">
          {React.createElement(currentBranchInfo?.icon || ClipboardList, { className: "mr-3 h-7 w-7" })}
          {currentBranchInfo?.name}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground hover:text-destructive">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proyecto_id" className="text-foreground flex items-center">
          <Briefcase className="mr-2 h-4 w-4 text-primary" />Proyecto Asociado
        </Label>
        <Select 
          onValueChange={(value) => handleProjectSelectChange(value)} 
          value={formData.proyecto_id?.toString() || ""} 
          disabled={isUploading}
        >
          <SelectTrigger className="w-full bg-background border-input">
            <SelectValue placeholder="Selecciona un proyecto..." />
          </SelectTrigger>
          <SelectContent>
            <div className="max-h-[300px] overflow-y-auto">
              {availableProjects.map(project => (
                <SelectItem 
                  key={project.id} 
                  value={project.id.toString()}
                  className="cursor-pointer hover:bg-accent"
                >
                  {project.nombre}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>

      {selectedBranch === 'solarIndustry' && <SolarIndustryFormSection formData={formData} handleInputChange={handleInputChange} disabled={isUploading} />}
      {selectedBranch === 'solarDomestic' && <SolarDomesticFormSection formData={formData} handleRadioChange={handleRadioChange} handleInputChange={handleInputChange} disabled={isUploading} />}
      {selectedBranch === 'heightSafety' && <HeightSafetyFormSection formData={formData} handleRadioChange={handleRadioChange} handleInputChange={handleInputChange} disabled={isUploading} />}
      {selectedBranch === 'piling' && <PilingFormSection formData={formData} handleInputChange={handleInputChange} disabled={isUploading} />}
      
      <FileUploadSection
        filePreviews={filePreviews}
        handleFileChange={handleFileChange}
        removeFile={removeFile}
        isUploading={isUploading}
        disabled={isUploading}
      />
      
      <div>
        <Label htmlFor="comentario_libre" className="text-foreground">Comentario Libre</Label>
        <Textarea 
          name="comentario_libre" 
          id="comentario_libre" 
          value={formData.comentario_libre || ''} 
          onChange={handleInputChange} 
          className="mt-1 bg-background border-input min-h-[100px]" 
          placeholder="Añade cualquier nota o comentario adicional..." 
          disabled={isUploading}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          disabled={isUploading || filePreviews.some(f => f.status === 'pending' || f.status === 'uploading')}
        >
          {isUploading || filePreviews.some(f => f.status === 'pending' || f.status === 'uploading') ? (
            <><Loader className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</>
          ) : "Guardar Informe"}
        </Button>
      </div>
    </motion.form>
  );
};

export default ActivityForm;