import { Briefcase } from 'lucide-react';

export const handleDragStartLogic = (taskId, setDraggingTaskId) => {
  setDraggingTaskId(taskId);
};

export const handleDropLogic = (employeeId, day, taskId, allProjectsAsTasks, employees, setAssignments, toast, getNewTaskInstanceCounter) => {
  const taskSource = allProjectsAsTasks.find(t => t.id === taskId);

  if (!taskSource) {
    console.error("Source task (project) not found for ID:", taskId);
    toast({
      title: "Error al asignar",
      description: `No se encontró el proyecto con ID ${taskId}. Intenta recargar.`,
      variant: "destructive",
    });
    return;
  }

  const assignmentKey = `${employeeId}-${day}`;
  const employeeName = employees.find(e => e.id === employeeId)?.name || employeeId;
  
  setAssignments(prevAssignments => {
    const newAssignments = { ...prevAssignments };
    if (!newAssignments[assignmentKey]) {
      newAssignments[assignmentKey] = [];
    }
    
    const newTaskInstance = { 
      ...taskSource,
      instanceId: getNewTaskInstanceCounter(),
      vehicle: taskSource.vehicle || null 
    };
    newAssignments[assignmentKey] = [...newAssignments[assignmentKey], newTaskInstance];
    
    toast({
        title: "Tarea Asignada",
        description: `"${newTaskInstance.title}" a ${employeeName} el ${day}.`,
    });
    return newAssignments;
  });
};

export const handleDragEndLogic = (hoveredCell, draggingTaskId, handleDrop, setDraggingTaskId, setHoveredCell) => {
  if (hoveredCell.employeeId && hoveredCell.day && draggingTaskId) {
      handleDrop(hoveredCell.employeeId, hoveredCell.day, draggingTaskId);
  }
  setDraggingTaskId(null);
  setHoveredCell({ employeeId: null, day: null });
};

export const handleCellPointerMoveLogic = (employeeId, day, draggingTaskId, setHoveredCell) => {
  if (draggingTaskId) {
      setHoveredCell({ employeeId, day });
  }
};

export const handleCellPointerLeaveLogic = (setHoveredCell) => {
   // setHoveredCell({ employeeId: null, day: null }); // Potentially reset if needed, but might cause flicker.
};

export const handleRemoveTaskLogic = (employeeId, day, taskInstanceIdToRemove, setAssignments, toast) => {
  const assignmentKey = `${employeeId}-${day}`;
  setAssignments(prev => {
    const newAssignments = { ...prev };
    if (newAssignments[assignmentKey]) {
      newAssignments[assignmentKey] = newAssignments[assignmentKey].filter(task => task.instanceId !== taskInstanceIdToRemove);
      if (newAssignments[assignmentKey].length === 0) {
        delete newAssignments[assignmentKey];
      }
    }
    return newAssignments;
  });
  toast({ title: "Tarea Eliminada", description: "La tarea ha sido eliminada de la planificación." });
};

export const handleAssignVehicleClickLogic = (task, employeeId, day, setCurrentTaskForVehicle, setShowAssignVehicleDialog) => {
  setCurrentTaskForVehicle({ 
    employeeId, 
    day, 
    taskId: task.projectId, 
    taskInstanceId: task.instanceId, 
    taskTitle: task.title, 
    currentVehicle: task.vehicle 
  });
  setShowAssignVehicleDialog(true);
};

export const handleAssignVehicleConfirmLogic = (employeeId, day, taskId, vehicle, currentTaskForVehicle, setAssignments, toast, setShowAssignVehicleDialog, setCurrentTaskForVehicle) => {
  const taskInstanceIdToUpdate = currentTaskForVehicle?.taskInstanceId;
  if (taskInstanceIdToUpdate === undefined) return;

  const assignmentKey = `${employeeId}-${day}`;
  setAssignments(prev => {
    const newAssignments = { ...prev };
    if (newAssignments[assignmentKey]) {
      newAssignments[assignmentKey] = newAssignments[assignmentKey].map(task => 
        task.instanceId === taskInstanceIdToUpdate ? { ...task, vehicle: vehicle } : task
      );
    }
    return newAssignments;
  });
  toast({ title: "Furgoneta Asignada", description: `Furgoneta ${vehicle ? `"${vehicle}" ` : ""}asignada a "${currentTaskForVehicle?.taskTitle}".` });
  setShowAssignVehicleDialog(false);
  setCurrentTaskForVehicle(null);
};

export const handleShowTaskDetailsLogic = (projectId, toast, navigate) => {
  toast({
    title: "Información de Obra",
    description: `Navegando a detalles del proyecto ${projectId}.`,
  });
  navigate(`/projects/${projectId}`);
};

export const handleCopyTaskLogic = (taskToCopy, toast) => {
  toast({
    title: "Copiar Tarea (Conceptual)",
    description: `Funcionalidad para copiar "${taskToCopy.title}" está en desarrollo. Implicaría seleccionar nueva celda.`,
  });
};

export const handleImportExcelLogic = (toast) => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = ".xlsx, .xls, .csv";
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      toast({
        title: "Archivo Seleccionado",
        description: `"${file.name}" listo para procesar (funcionalidad no implementada).`,
      });
    }
  };
  fileInput.click();
};
