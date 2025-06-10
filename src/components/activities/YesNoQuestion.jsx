import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const YesNoQuestion = ({ name, label, value, onChange, disabled = false }) => (
  <div className="space-y-2">
    <Label className="text-foreground">{label}</Label>
    <RadioGroup name={name} value={value || ""} onValueChange={(val) => onChange(name, val)} className="flex space-x-4" disabled={disabled}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="yes" id={`${name}-yes`} disabled={disabled} />
        <Label htmlFor={`${name}-yes`} className="font-normal">Sí</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="no" id={`${name}-no`} disabled={disabled} />
        <Label htmlFor={`${name}-no`} className="font-normal">No</Label>
      </div>
    </RadioGroup>
  </div>
);

export default YesNoQuestion;