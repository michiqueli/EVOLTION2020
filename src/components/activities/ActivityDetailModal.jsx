import React, { useState, useEffect, useRef } from "react"; // Importa useRef
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // Asegúrate de tener este componente de botón
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

// Importa las librerías para generar PDF
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ActivityDetailModal = ({
  isOpen,
  onClose,
  activity,
  activityBranches,
}) => {
  // Si no hay actividad, no renderizamos nada
  if (!activity) return null;

  const { toast } = useToast();
  const [projectName, setProjectName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorFetching, setErrorFetching] = useState(null);

  // Ref para el contenido que se convertirá a PDF
  const pdfContentRef = useRef(null);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      setErrorFetching(null);

      // Si no hay un ID de proyecto asociado, mostramos un mensaje
      if (!activity.proyecto_id) {
        setProjectName("No hay un Proyecto Asociado.");
        setIsLoading(false);
        return;
      }

      // Buscamos el proyecto directamente en la tabla 'proyectos' por su ID
      const { data, error } = await supabase
        .from("proyectos")
        .select("nombre") // Selecciona el campo 'nombre'
        .eq("id", activity.proyecto_id)
        .single(); // Esperamos un único resultado

      if (error) throw error;

      if (data) {
        setProjectName(data.nombre);
      } else {
        setProjectName("Proyecto No encontrado");
      }
    } catch (error) {
      console.error("Error al buscar el proyecto:", error);
      setErrorFetching(error.message);
      toast({
        title: "Error al buscar proyecto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Ejecuta fetchProject solo cuando el modal esté abierto y 'activity' esté disponible
    if (isOpen && activity) {
      fetchProject();
    }
    // Añadimos isOpen y activity.proyecto_id a las dependencias para re-fetch si cambian
  }, [isOpen, activity?.proyecto_id]);

  const getBranchName = (branchId) => {
    return (
      activityBranches.find((b) => b.id === branchId)?.name || "Desconocido"
    );
  };

  // Función para generar el PDF
  const generatePdf = async () => {
    if (!pdfContentRef.current) {
      toast({
        title: "Error de contenido",
        description: "No se pudo encontrar el contenido para generar el PDF.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generando PDF...",
      description: "Por favor, espera un momento.",
    });

    try {
      const canvas = await html2canvas(pdfContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4"); //
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const logoUrl = "/logo_evoltion.png"; // Asegúrate de que esta ruta sea correcta
      const logoWidth = 50; // Ancho del logo en mm
      const logoHeight = 15; // Alto del logo en mm
      const logoX = 10; // Posición X del logo en mm
      const logoY = 20; // Posición Y del logo en mm

      // Agrega el logo
      pdf.addImage(logoUrl, "PNG", logoX, logoY, logoWidth, logoHeight);

      // Título del reporte
      pdf.setFontSize(24);
      pdf.setTextColor(40, 40, 40); // Color de texto (RGB)
      pdf.text("Reporte de Actividad", 70, 30); // Posición X, Y

      // Línea separadora
      pdf.setDrawColor(150, 150, 150); // Color de la línea
      pdf.line(10, 40, 200, 40); // X1, Y1, X2, Y2

      // Información de la fecha de generación
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Fecha de generación: ${new Date().toLocaleDateString("es-AR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        10,
        pageHeight - 10
      );
      // --- Fin Personalización ---

      position = 50;

      if (imgHeight < pageHeight - position) {
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      } else {
        let cursor = 0;
        while (cursor < canvas.height) {
          if (cursor > 0) {
            pdf.addPage();
          }
          const sliceHeight = Math.min(
            canvas.height - cursor,
            (pageHeight - position) * (canvas.width / imgWidth)
          );

          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = sliceHeight;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.drawImage(
            canvas,
            0,
            cursor,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );

          const tempImgData = tempCanvas.toDataURL("image/png");

          pdf.addImage(
            tempImgData,
            "PNG",
            0,
            position,
            imgWidth,
            (sliceHeight * imgWidth) / canvas.width
          );
          cursor += sliceHeight;
        }
      }

      pdf.save(`Reporte_Actividad_${activity.id || "detalle"}.pdf`);

      toast({
        title: "PDF Generado",
        description: "El PDF se ha descargado correctamente.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      toast({
        title: "Error al generar PDF",
        description: `Hubo un problema al crear el PDF: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Detalles de la Actividad</DialogTitle>
          <DialogDescription>
            Información detallada de la actividad realizada.
          </DialogDescription>
        </DialogHeader>

        <div id="pdf-content" ref={pdfContentRef} className="p-6">
          {" "}
          <h2 className="text-xl font-bold mb-4 print-only">
            Detalles de la Actividad
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-medium">Tipo de Trabajo</h4>
              <p className="text-sm text-muted-foreground">
                {getBranchName(activity.branch)}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Nombre del Proyecto</h4>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Buscando proyecto..."
                  : errorFetching
                  ? `Error: ${errorFetching}`
                  : projectName}
              </p>
            </div>
            {activity.comentario_libre && (
              <div>
                <h4 className="font-medium">Comentarios</h4>
                <p className="text-sm text-muted-foreground">
                  {activity.comentario_libre}
                </p>
              </div>
            )}
            {activity.created_at && (
              <div>
                <h4 className="font-medium">Fecha</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(activity.created_at).toLocaleDateString("es-ES")}{" "}
                </p>
              </div>
            )}
            {activity.imagenes && JSON.parse(activity.imagenes).length > 0 && (
              <div>
                <h4 className="font-medium">Imágenes</h4>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {JSON.parse(activity.imagenes).map((img, index) => (
                    <div
                      key={index}
                      className="w-full flex justify-center items-center overflow-hidden"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                       
                        className="w-[60%] h-auto rounded-md border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botón para exportar a PDF */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={generatePdf}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Exportar a PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;
