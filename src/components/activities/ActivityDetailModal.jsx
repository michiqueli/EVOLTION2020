import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import {
  Users,
  Image as ImageIcon,
  FileText,
  Zap,
  ClipboardSignature,
  ClipboardList,
} from "lucide-react";
import { ALL_METRICS_CONFIG } from "@/lib/planningConfig";
import { add } from "date-fns";

const isImageFile = (fileName) => {
  if (!fileName) return false;
  const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  return validExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
};

// Función para añadir la imagen de fondo a una página del PDF
const addBackgroundImage = async (pdf, docWidth, docHeight) => {
  try {
    const backgroundUrl = "/membrete.jpg"; // ¡IMPORTANTE! Reemplaza con la ruta a tu imagen en la carpeta /public
    // Necesitamos cargar la imagen para obtener sus dimensiones
    const img = new Image();
    img.src = backgroundUrl;
    await new Promise((resolve) => (img.onload = resolve));
    // Añadimos la imagen cubriendo toda la página
    pdf.addImage(img, "PNG", 0, 0, docWidth, docHeight, undefined, "FAST");
  } catch (e) {
    console.error(
      "No se pudo cargar la imagen de fondo. Asegúrate que la ruta es correcta en la carpeta /public.",
      e
    );
  }
};

const ActivityDetailModal = ({ isOpen, onClose, activity }) => {
  const { toast } = useToast();
  const [assignedTeam, setAssignedTeam] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  // useEffect para buscar los compañeros de equipo que ficharon ese día en ese proyecto
  useEffect(() => {
    if (isOpen && activity?.project_id && activity?.report_date) {
      const fetchTeamWhoWorked = async () => {
        setLoadingTeam(true);
        try {
          const projectIntId = activity?.proyectos?.id;
          if (!projectIntId) {
            console.log(
              "Esperando los detalles completos del proyecto para buscar el equipo..."
            );
            setAssignedTeam([]); // Dejamos la lista de equipo vacía
            return; // Salimos de la función tempranamente
          }

          const { data, error } = await supabase
            .from("time_tracking")
            .select("usuarios!time_tracking_user_id_fkey(nombre, rol)")
            .eq("project_id", projectIntId)
            .eq("date", activity.report_date);

          if (error) throw error;
          // Eliminamos duplicados por si alguien fichó más de una vez
          const uniqueUsers = Array.from(
            new Map(
              data.map((item) => [item.usuarios.nombre, item.usuarios])
            ).values()
          );
          setAssignedTeam(uniqueUsers || []);
        } catch (error) {
          console.error("Error fetching team members:", error);
          setAssignedTeam([]);
        } finally {
          setLoadingTeam(false);
        }
      };
      fetchTeamWhoWorked();
    }
  }, [isOpen, activity]);

  if (!activity) return null;

  const performedActivities = useMemo(() => {
    const activitiesList = [];
    const projectTypes = activity.proyectos?.project_type || [];

    projectTypes.forEach((type) => {
      const metricsForType = ALL_METRICS_CONFIG[type] || [];
      metricsForType.forEach((metric) => {
        const value = activity[metric.reportKey];
        if (value && Number(value) > 0) {
          activitiesList.push(
            `${metric.actionPhrase} ${value} ${metric.unit} de ${metric.item}`
          );
        }
      });
    });
    return activitiesList;
  }, [activity]);

  // Procesamos los datos una sola vez
  console.log(activity);
  const images = activity.imagenes ? JSON.parse(activity.imagenes) : [];
  const projectName = activity.proyectos?.nombre || "Proyecto no especificado";
  const creatorName = activity.creador?.nombre || "No especificado";

  const generatePdf = async () => {
    toast({
      title: "Generando PDF...",
      description: "Por favor, espera un momento.",
    });
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const docWidth = doc.internal.pageSize.getWidth();
      const docHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = 55; // Empezamos a escribir más abajo para dejar espacio al membrete

      await addBackgroundImage(doc, docWidth, docHeight);

      // --- LÓGICA DE FECHA CORREGIDA ---
      // 1. Damos formato a la fecha
      const reportDateFormatted = new Date(
        activity.report_date + "T12:00:00Z"
      ).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // 2. La dibujamos en la posición 'y' actual
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(reportDateFormatted, docWidth - margin, y, { align: "right" });

      // 3. Incrementamos 'y' para que el título aparezca debajo
      y += 15;

      // Título del Proyecto
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text(`INFORME DIARIO`, docWidth / 2, y, {
        align: "center",
      });
      y += 10;
      doc.text(projectName, docWidth / 2, y, {
        align: "center",
      });
      y += 5;
      doc.setDrawColor(200);
      doc.line(margin, y, docWidth - margin, y);
      y += 10;
      const addSection = (title, content, options = {}) => {
        if (!content || content.length === 0) return;

        const titleHeight = 7;
        const contentHeight =
          doc.splitTextToSize(content, docWidth - margin * 2).length * 5;
        if (y + titleHeight + contentHeight > docHeight - margin) {
          doc.addPage();
          addBackgroundImage(doc, docWidth, docHeight);
          y = 60; // Posición vertical inicial en nueva página
        }

        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text(title, margin, y);
        y += 7;
        doc.setFontSize(11);
        doc.setFont(undefined, "normal");
        doc.setTextColor(80);
        const textLines = doc.splitTextToSize(content, docWidth - margin * 2);
        doc.text(textLines, margin, y);
        y += textLines.length * 5 + 10;
      };

      const activitiesText = performedActivities.join("\n");
      // Secciones de texto
      await addSection(
        "ACTIVIDADES REALIZADAS",
        activitiesText || "No se reportaron cantidades para este día."
      );

      if (assignedTeam.length > 0) {
        let teamText = assignedTeam
          .map((t) => `${t.nombre} (${t.rol || "Técnico"})`)
          .join("\n");
        addSection(
          "PERSONAL INVOLUCRADO",
          teamText || "No se registraron fichajes para este día y proyecto."
        );
      }

      // Registro Fotográfico
      if (images.length > 0) {
        addSection("REGISTRO FOTOGRÁFICO", "");

        for (const img of images) {
          try {
            // 1. Cargamos la imagen para poder leer sus dimensiones originales
            const image = new Image();
            image.crossOrigin = "Anonymous"; // Importante para cargar imágenes de otras URLs
            image.src = img.url;
            await new Promise((resolve, reject) => {
              image.onload = resolve;
              img.onerror = (err) =>
                reject(new Error("No se pudo cargar la imagen."));
            });

            // 2. Definimos el área MÁXIMA en la que queremos que quepa la imagen
            const maxWidth = 90; // Ancho máximo en mm (casi todo el ancho de la página A4)
            const maxHeight = 80; // Alto máximo en mm

            // 3. Calculamos las nuevas dimensiones manteniendo la proporción
            let imgWidth = image.naturalWidth;
            let imgHeight = image.naturalHeight;
            const ratio = imgWidth / imgHeight;

            if (imgWidth > maxWidth) {
              imgWidth = maxWidth;
              imgHeight = imgWidth / ratio;
            }

            if (imgHeight > maxHeight) {
              imgHeight = maxHeight;
              imgWidth = imgHeight * ratio;
            }

            // 4. Comprobamos si la imagen cabe en la página actual
            // Sumamos el alto de la imagen + 15mm para el pie de foto y espaciado
            if (y + imgHeight + 15 > docHeight - margin) {
              doc.addPage();
              await addBackgroundImage(doc, docWidth, docHeight);
              y = 30; // Reseteamos la posición vertical en la nueva página
            }

            // 5. Añadimos la imagen al PDF con sus nuevas dimensiones calculadas y centrada
            doc.addImage(
              image,
              "JPEG", // Es más seguro especificar el tipo si lo conoces, JPEG es común.
              (docWidth - imgWidth) / 2, // Centrado horizontalmente
              y,
              imgWidth,
              imgHeight
            );

            // Incrementamos 'y' según el alto de la imagen que acabamos de añadir
            y += imgHeight + 5;

            // Añadimos el nombre del archivo como pie de foto
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(img.name || "Imagen adjunta", docWidth / 2, y, {
              align: "center",
            });
            y += 10;
          } catch (imgError) {
            console.error(
              "No se pudo añadir la imagen al PDF:",
              img.url,
              imgError
            );
            // Si una imagen falla, escribimos un error en el PDF y continuamos
            doc.text(
              `[Error al cargar imagen: ${img.name || "desconocido"}]`,
              margin,
              y
            );
            y += 10;
          }
        }
      } else {
        addSection(
          "REGISTRO FOTOGRÁFICO",
          "No se adjuntaron imágenes para este día."
        );
      }

      await addSection(
        "COMENTARIOS ADICIONALES",
        activity.comentario_libre || "No hay comentarios adicionales."
      );

      // Firma
      addSection("RESPONSABLE", `Nombre: ${creatorName}`);

      doc.save(`${activity.report_date}-${projectName.replace(/ /g, "_")}.pdf`);
      toast({ title: "PDF Generado", variant: "success" });
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      toast({
        title: "Error al generar PDF",
        description: `Hubo un problema: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl">
            Detalle de Informe Diario
          </DialogTitle>
          <DialogDescription>
            Informe del día{" "}
            {new Date(activity.report_date + "T00:00:00").toLocaleDateString(
              "es-AR",
              { dateStyle: "long" }
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-6 space-y-6">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <p className="font-bold text-lg">{projectName}</p>
              <p className="text-muted-foreground">Informe Diario</p>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                ACTIVIDADES REALIZADAS
              </h3>
              {performedActivities.length > 0 ? (
                <ul className="list-disc pl-10 text-muted-foreground">
                  {performedActivities.map((text, i) => (
                    <li key={i}>{text}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground pl-6 italic">
                  No se reportaron cantidades para este día.
                </p>
              )}
            </section>

            <section>
              <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                PERSONAL INVOLUCRADO
              </h3>
              {loadingTeam ? (
                <p className="pl-6 text-muted-foreground italic">
                  Cargando equipo...
                </p>
              ) : (
                <ul className="list-disc pl-10 text-muted-foreground">
                  {assignedTeam.length > 0 ? (
                    assignedTeam.map((member, i) => (
                      <li key={i}>
                        {member.nombre} ({member.rol || "Técnico"})
                      </li>
                    ))
                  ) : (
                    <li>
                      No se registraron fichajes para este día y proyecto.
                    </li>
                  )}
                </ul>
              )}
            </section>

            {images.length > 0 && (
              <section>
                <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  REGISTRO FOTOGRÁFICO
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pl-6">
                  {images.map((img, index) => (
                    <a
                      key={index}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      {/* --- CORRECCIÓN DE IMAGEN ROTA --- */}
                      {isImageFile(img.name) ? (
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-32 object-cover rounded-md border group-hover:opacity-80"
                        />
                      ) : (
                        <div className="w-full h-32 rounded-md border bg-muted flex items-center justify-center group-hover:bg-muted/80">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}

                      <p
                        className="text-xs text-center text-muted-foreground mt-1 truncate"
                        title={img.name}
                      >
                        {img.name}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            )}
            <section>
              <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                COMENTARIOS ADICIONALES
              </h3>
              {activity.comentario_libre ? (
                <p className="pl-6 text-muted-foreground">
                  {activity.comentario_libre}
                </p>
              ) : (
                <p className="text-muted-foreground pl-6 italic">
                  No hay comentarios adicionales.
                </p>
              )}
            </section>

            <section>
              <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                <ClipboardSignature className="h-4 w-4 text-primary" />
                RESPONSABLE
              </h3>
              <div className="pl-6">
                <p>Nombre: {creatorName}</p>
              </div>
            </section>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={generatePdf}>Exportar a PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;
