import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- Paletas de Colores y Estilos Base ---
const EMPLOYEE_BG_COLORS = [
  "FFE8E8E8",
  "FFD4E9F7",
  "FFE5F7E5",
  "FFFFF8E1",
  "FFF3E5F5",
];

const applyBorderStyle = (
  cell,
  style = "thin",
  color = { argb: "FFB0B0B0" }
) => {
  cell.border = {
    top: { style, color },
    left: { style, color },
    bottom: { style, color },
    right: { style, color },
  };
};

// --- Función para crear la Hoja Semanal ---
const createWeeklySheet = (
  workbook,
  employees,
  displayDates,
  assignments,
  projectColors,
  projects,
  vehicles
) => {
  const worksheet = workbook.addWorksheet("Planilla Semanal");

  // 1. Definir Columnas
  const columns = [
    { header: "Equipo", key: "employee", width: 30 },
    ...displayDates.map((day, index) => ({
      header: `${day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1)} ${
        day.dayOfMonth
      }`,
      key: `day_${index}`,
      width: 35,
    })),
  ];
  worksheet.columns = columns;

  // 2. Estilo de Cabecera Principal
  const headerRow = worksheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" },
    };
    cell.font = {
      name: "Arial",
      bold: true,
      size: 12,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    applyBorderStyle(cell, "thin", { argb: "FFFFFFFF" });
  });

  // 3. Añadir y Estilizar Filas de Empleados y Tareas
  employees.forEach((employee, index) => {
    const rowData = { employee: `${employee.nombre}` };
    const taskStyles = [];

    displayDates.forEach((day, dayIndex) => {
      const cellKey = `${employee.id}-${
        day.fullDate.toISOString().split("T")[0]
      }`;
      const tasks = assignments[cellKey] || [];
      rowData[`day_${dayIndex}`] = tasks
        .map((task) => `Obra: ${task.title}`)
        .join();

      if (tasks.length > 0) {
        const colorInfo = projectColors[tasks[0].projectId];
        if (colorInfo && colorInfo.hex) {
          taskStyles[dayIndex] = {
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: colorInfo.hex },
            },
          };
        }
      }
    });

    const addedRow = worksheet.addRow(rowData);
    addedRow.height = 40;

    // Estilo celda de empleado
    const employeeCell = addedRow.getCell("employee");
    employeeCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EMPLOYEE_BG_COLORS[index % EMPLOYEE_BG_COLORS.length] },
    };
    employeeCell.font = { name: "Arial", bold: true, size: 14 };
    employeeCell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
    };
    applyBorderStyle(employeeCell);

    // Estilo celdas de tareas
    displayDates.forEach((day, dayIndex) => {
      const taskCell = addedRow.getCell(`day_${dayIndex}`);
      taskCell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      taskCell.font = { name: "Arial", bold: true, size: 12 };
      if (taskStyles[dayIndex]) {
        taskCell.fill = taskStyles[dayIndex].fill;
      }
      applyBorderStyle(taskCell);
    });
  });

  // 4. Añadir Sección de Obras Activas y Vehículos
  let currentRowIndex = worksheet.lastRow.number + 2; // Dejar una fila de espacio

  worksheet.mergeCells(`A${currentRowIndex}:D${currentRowIndex}`);
  const titleRow = worksheet.getRow(currentRowIndex);
  titleRow.getCell("A").value = "Obras Activas y Vehículos Asignados";
  titleRow.getCell("A").font = {
    name: "Arial",
    bold: true,
    size: 16,
    color: { argb: "FF4F46E5" },
  };
  titleRow.getCell("A").alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  currentRowIndex++;

  const sectionHeaderRow = worksheet.addRow(["Obra", "Vehículos Asignados", "Hora de ingreso"]);
  sectionHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, size: 14 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8E8E8" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    applyBorderStyle(cell, "thin", { argb: "FF000000" });
  });
  currentRowIndex++;

  projects.forEach((project) => {
    const vehiclesString = (project.vehiculos_asignados || [])
      .map((id) => {
        const vehicle = vehicles.find((v) => v.id === id);
        return vehicle ? `• ${vehicle.numero_interno}` : "";
      })
      .filter(Boolean)
      .join(" ");

    const projectRow = worksheet.addRow([project.nombre, vehiclesString, project.default_start_time]);
    projectRow.height = 25;

    const projectCell = projectRow.getCell(1);
    const vehicleCell = projectRow.getCell(2);
    const hourCell = projectRow.getCell(3)

    applyBorderStyle(projectCell);
    applyBorderStyle(vehicleCell);
    applyBorderStyle(hourCell);


    projectCell.alignment = { vertical: "middle", horizontal: "left" };
    projectCell.font = { bold: true, size: 14 };
    vehicleCell.alignment = {
      vertical: "top",
      horizontal: "left",
      wrapText: true,
    };
    vehicleCell.font = { bold: true, size: 14 };

    const colorInfo = projectColors[project.id];
    if (colorInfo && colorInfo.hex) {
      projectCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colorInfo.hex },
      };
    }
    hourCell.alignment = { vertical: "middle", horizontal: "center" };
    hourCell.font = { bold: true, size: 14 };
  });
};

// --- FUNCIÓN PARA CREAR LA HOJA MENSUAL ---
const createMonthlySheet = (
  workbook,
  employee,
  calendarWeeks,
  assignments,
  projectColors,
  startDate
) => {
  // CAMBIO: Se genera el título dinámico con el mes y el año.
  const monthName = startDate.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
  const title = `Planificación de ${
    monthName.charAt(0).toUpperCase() + monthName.slice(1)
  } - ${employee.nombre}`;

  const worksheet = workbook.addWorksheet(`${monthName}`);
  worksheet.mergeCells("A1:G1");
  worksheet.getCell("A1").value = title;
  worksheet.getCell("A1").font = {
    name: "Arial",
    bold: true,
    size: 18,
    color: { argb: "FF4F46E5" },
  };
  worksheet.getCell("A1").alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  worksheet.getRow(1).height = 30;

  const dayHeaders = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  const headerRow = worksheet.addRow(dayHeaders);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" },
    };
    cell.font = {
      name: "Arial",
      bold: true,
      size: 12,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  calendarWeeks.forEach((week) => {
    const addedRow = worksheet.addRow([]);
    addedRow.height = 90;

    week.forEach((day, dayIndex) => {
      const cell = addedRow.getCell(dayIndex + 1);
      cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      applyBorderStyle(cell);

      if (!day) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
        return;
      }

      const tasks =
        assignments[
          `${employee.id}-${day.fullDate.toISOString().split("T")[0]}`
        ] || [];

      cell.value = {
        richText: [
          { text: `${day.dayOfMonth}\n`, font: { size: 14, bold: true } },
          ...tasks.map((task) => ({
            text: `• ${task.title}\n`,
            font: { size: 11 },
          })),
        ],
      };

      if (tasks.length > 0) {
        const colorInfo = projectColors[tasks[0].projectId];
        if (colorInfo && colorInfo.hex) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorInfo.hex },
          };
        }
      }
    });
  });

  worksheet.columns.forEach((column) => {
    column.width = 30;
  });
};
// --- FUNCIÓN PRINCIPAL DE EXPORTACIÓN ---
export const exportToExcel = async ({
  isMonthView,
  employees,
  displayDates,
  assignments,
  calendarWeeks,
  projectColors,
  projects,
  vehicles,
  startDate,
}) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TuApp";
    workbook.created = new Date();
    let fileName;

    if (isMonthView) {
      if (!employees || employees.length === 0) {
        alert(
          "Por favor, selecciona un empleado para exportar la vista mensual."
        );
        return;
      }
      createMonthlySheet(
        workbook,
        employees[0],
        calendarWeeks,
        assignments,
        projectColors,
        startDate
      );
      const monthName = startDate
        .toLocaleDateString("es-AR", {
          month: "long",
          year: "numeric",
        })
        .replaceAll(" ", "_");
      fileName = `Planificacion_${monthName}_${employees[0].nombre}.xlsx`;
    } else {
      createWeeklySheet(
        workbook,
        employees,
        displayDates,
        assignments,
        projectColors,
        projects,
        vehicles
      );
      fileName = "Planificacion_Semanal.xlsx";
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);
  } catch (error) {
    console.error("Error al exportar a Excel con exceljs:", error);
    alert("Ocurrió un error al intentar generar el archivo de Excel.");
  }
};
