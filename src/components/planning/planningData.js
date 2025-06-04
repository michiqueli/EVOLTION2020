import { Briefcase, Car } from 'lucide-react';

export const initialEmployees = [
  { id: 'emp1', name: 'Carlos Rodriguez', avatar: 'https://randomuser.me/api/portraits/men/75.jpg' },
  { id: 'emp2', name: 'Ana López', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: 'emp3', name: 'Pedro Martinez', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 'emp4', name: 'Lucía Fernández', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 'emp5', name: 'Javier Sanz', avatar: 'https://randomuser.me/api/portraits/men/40.jpg' },
];

export const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const initialTasksData = [
  { id: "task1", projectId: "proj001", title: "Proyecto Edificio Central con un nombre muy largo para probar truncado", icon: Briefcase, color: "bg-blue-400/70 border border-blue-600/30", vehicle: null },
  { id: "task2", projectId: "proj002", title: "Instalación Solar Pérez", icon: Briefcase, color: "bg-orange-400/70 border border-orange-600/30", vehicle: null },
  { id: "task3", projectId: "proj003", title: "Mantenimiento Alturas Corp.", icon: Briefcase, color: "bg-teal-400/70 border border-teal-600/30", vehicle: null },
  { id: "task4", projectId: "proj004", title: "Hincado Terreno Norte", icon: Briefcase, color: "bg-purple-400/70 border border-purple-600/30", vehicle: null },
  { id: "task5", projectId: "proj005", title: "Revisión Industrial XYZ y algo más para que sea largo", icon: Briefcase, color: "bg-pink-400/70 border border-pink-600/30", vehicle: null },
];

export const availableVehicles = [
  { id: "van1", name: "Furgoneta A - Ford Transit", icon: Car },
  { id: "van2", name: "Furgoneta B - Renault Master", icon: Car },
  { id: "truck1", name: "Camión C - Iveco Daily", icon: Car },
];