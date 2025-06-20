import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Haremos la función más específica para exportar fichajes de tiempo
export const exportTimeEntriesToExcel = async (timeEntries) => {
  if (!timeEntries || timeEntries.length === 0) {
    // La función ahora devuelve un error si no hay datos
    throw new Error("No hay datos para exportar.");
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Control Horario');

  // Definimos las cabeceras del Excel
  worksheet.columns = [
    { header: 'Usuario', key: 'userName', width: 30 },
    { header: 'Proyecto', key: 'projectName', width: 30 },
    { header: 'Fecha', key: 'date', width: 15, style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'Hora de Inicio', key: 'startTime', width: 15 },
    { header: 'Hora de Fin', key: 'endTime', width: 15 },
    { header: 'Tiempo Trabajado (hs)', key: 'workTime', width: 20, style: { numFmt: '0.00' } },
    { header: 'Notas', key: 'notes', width: 50 },
  ];

  // Formateamos los datos para que coincidan con las 'key' de las columnas
  const dataToExport = timeEntries.map(entry => ({
    userName: entry.autor?.nombre || 'Desconocido',
    projectName: entry.project_name,
    date: new Date(entry.date), // Pasamos el objeto Date para que Excel lo reconozca
    startTime: new Date(entry.start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    endTime: entry.end_time ? new Date(entry.end_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : 'En curso',
    workTime: typeof entry.work_time === 'number' ? entry.work_time : 0, // Pasamos el número directamente
    notes: entry.notes || ''
  }));

  // Añadimos las filas de datos
  worksheet.addRows(dataToExport);

  // Estilo para la cabecera
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF020617' } }; // Oscuro
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF475569' } }
    };
  });
  
  // Generamos el buffer y lo devolvemos para que el componente lo descargue
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};