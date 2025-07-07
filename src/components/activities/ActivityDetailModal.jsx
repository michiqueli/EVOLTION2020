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
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  Zap,
  ClipboardSignature,
} from "lucide-react";
import { ALL_METRICS_CONFIG } from "@/lib/planningConfig";

// Función auxiliar para parsear el texto de comentarios en secciones
const parseComments = (text) => {
  if (!text) {
    return { description: "", incidents: "", requests: "" };
  }

  let remainingText = text;
  let incidents = "";
  let requests = "";

  const incidentKeywords = ["incidencias:", "incidencia:"];
  const requestKeywords = ["solicitud:", "solicitudes:"];

  // Función para extraer una sección y quitarla del texto principal
  const extractSection = (keywords, currentText) => {
    const lowerCaseText = currentText.toLowerCase();
    for (const keyword of keywords) {
      const keywordIndex = lowerCaseText.indexOf(keyword);
      if (keywordIndex !== -1) {
        const sectionText = currentText
          .substring(keywordIndex + keyword.length)
          .trim();
        const mainText = currentText.substring(0, keywordIndex).trim();
        return { mainText, sectionText };
      }
    }
    return { mainText: currentText, sectionText: "" };
  };

  // Extraer incidencias primero
  const incidentResult = extractSection(incidentKeywords, remainingText);
  remainingText = incidentResult.mainText;
  incidents = incidentResult.sectionText;

  // Extraer solicitudes del texto restante (o de las incidencias si estaba anidado)
  const requestResult = extractSection(
    requestKeywords,
    incidents || remainingText
  );
  requests = requestResult.sectionText;

  // Limpiar el texto de incidencias si la solicitud estaba dentro
  if (incidents && requests) {
    incidents = requestResult.mainText;
  } else {
    remainingText = requestResult.mainText;
  }

  return { description: remainingText, incidents, requests };
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
  console.log(activity)
  const { description, incidents, requests } = parseComments(
    activity.comentario_libre
  );
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
      let y = 20;

      // --- PÁGINA 1 ---
      await addBackgroundImage(doc, docWidth, docHeight);

      // Encabezado
      y += 15;
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text(`INFORME DIARIO: ${projectName}`, docWidth / 2, y, {
        align: "center",
      });
      y += 10;
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
          y = 20; // Posición vertical inicial en nueva página
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

      // Secciones de texto
      addSection("1. DESCRIPCIÓN DE ACTIVIDADES REALIZADAS", description);

      if (assignedTeam.length > 0) {
        let teamText = assignedTeam
          .map((t) => `${t.nombre} (${t.rol || "Técnico"})`)
          .join("\n");
        addSection(
          "2. PERSONAL INVOLUCRADO",
          teamText || "No se registraron fichajes para este día y proyecto."
        );
      }

      addSection(
        "3. INCIDENCIAS",
        incidents || "No se registraron incidencias."
      );

      // Firma
      addSection(
        "5. FIRMA DEL RESPONSABLE",
        `Nombre: ${creatorName}\n\nFirma: _____________________________`
      );

      // Registro Fotográfico
      if (images.length > 0) {
        doc.addPage();
        await addBackgroundImage(doc, docWidth, docHeight);
        y = 20;
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text("4. REGISTRO FOTOGRÁFICO", margin, y);
        y += 10;

        for (const img of images) {
          const imgHeight = 80;
          const imgWidth = 120;
          if (y + imgHeight + 10 > docHeight - margin) {
            doc.addPage();
            await addBackgroundImage(doc, docWidth, docHeight);
            y = 20;
          }
          try {
            // jsPDF puede cargar imágenes desde URLs si el CORS es correcto
            doc.addImage(
              img.url,
              "PNG",
              (docWidth - imgWidth) / 2,
              y,
              imgWidth,
              imgHeight,
              undefined,
              "FAST"
            );
            y += imgHeight + 5;
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
            doc.text(`[Error al cargar imagen: ${img.name}]`, margin, y);
            y += 10;
          }
        }
      }

      // Solicitud de Material
      if (requests) {
        doc.addPage();
        await addBackgroundImage(doc, docWidth, docHeight);
        y = 20;
        addSection("SOLICITUD DE MATERIAL Y/O SERVICIO", requests);
      }

      doc.save(
        `Informe-${projectName.replace(/ /g, "_")}-${activity.report_date}.pdf`
      );
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
                <Zap className="h-4 w-4 text-primary" /> 1. ACTIVIDADES
                REALIZADAS
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
                <Users className="h-4 w-4 text-primary" /> 2. PERSONAL
                INVOLUCRADO
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

            {incidents && (
              <section>
                <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary" /> 3.
                  INCIDENCIAS
                </h3>
                <p className="text-muted-foreground pl-6 whitespace-pre-wrap">
                  {incidents}
                </p>
              </section>
            )}

            {images.length > 0 && (
              <section>
                <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" /> 4. REGISTRO
                  FOTOGRÁFICO
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
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-32 object-cover rounded-md border group-hover:opacity-80 transition-opacity"
                      />
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
                <ClipboardSignature className="h-4 w-4 text-primary" /> 5. FIRMA
                DEL RESPONSABLE
              </h3>
              <div className="pl-6">
                <p>Nombre: {creatorName}</p>
                <p className="mt-4">Firma: _____________________________</p>
              </div>
            </section>

            {requests && (
              <section className="pt-6 border-t mt-6">
                <h3 className="font-bold text-base mb-2 text-primary">
                  SOLICITUD DE MATERIAL Y/O SERVICIO
                </h3>
                <p className="text-muted-foreground pl-6 whitespace-pre-wrap">
                  {requests}
                </p>
              </section>
            )}
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
