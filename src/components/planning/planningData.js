
import { Briefcase } from 'lucide-react';

export const initialEmployees = [
  { id: 'emp1', name: 'Carlos' },
  { id: 'emp2', name: 'Ana' },
  { id: 'emp3', name: 'Pedro' },
  { id: 'emp4', name: 'Lucía' },
  { id: 'emp5', name: 'Javier' },
];

export const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const getProjectColor = (index) => {
  const colors = [
    "bg-blue-400/70 border border-blue-600/30",
    "bg-orange-400/70 border border-orange-600/30",
    "bg-teal-400/70 border border-teal-600/30",
    "bg-purple-400/70 border border-purple-600/30",
    "bg-pink-400/70 border border-pink-600/30",
    "bg-yellow-400/70 border border-yellow-600/30",
    "bg-green-400/70 border border-green-600/30",
    "bg-red-400/70 border border-red-600/30",
  ];
  return colors[index % colors.length];
};