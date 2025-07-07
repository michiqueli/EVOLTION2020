import React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileImage as ImageIcon,
  Trash2,
  Loader,
  CheckCircle,
  XCircle,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const isImageFile = (fileName) => {
  const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  return validExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
};
const FileUploadSection = ({
  filePreviews,
  handleFileChange,
  removeFile,
  isUploading,
  disabled,
}) => (
  <div className="space-y-2">
    <Label className="text-foreground flex items-center">
      <ImageIcon className="mr-2 h-4 w-4 text-primary" />
      Fotografias de Trabajos Realizados
    </Label>
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor="dropzone-file"
        className={cn(
          "flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-background hover:bg-secondary/50",
          { "opacity-50 cursor-not-allowed": isUploading || disabled }
        )}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud
            className={cn("w-8 h-8 mb-2 text-muted-foreground", {
              "animate-pulse": isUploading,
            })}
          />
          <p className="mb-1 text-sm text-muted-foreground">
            <span className="font-semibold">Click para subir</span> o arrastrar
            y soltar
          </p>
          <p className="text-xs text-muted-foreground">
            SVG, PNG, JPG, PDF (MAX. 5MB por archivo)
          </p>
        </div>
        <Input
          id="dropzone-file"
          type="file"
          className="hidden"
          multiple
          onChange={handleFileChange}
          disabled={isUploading || disabled}
          accept="image/png, image/jpeg, image/svg+xml, application/pdf"
        />
      </label>
    </div>
    {filePreviews.length > 0 && (
      <div className="mt-4 space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Archivos Seleccionados:
        </h4>
        {filePreviews.map((preview) => (
          <motion.div
            key={preview.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center justify-between p-2 pr-1 rounded-md border border-input bg-secondary/30 text-sm"
          >
            <div className="flex items-center gap-3 truncate">
              {/* --- LÓGICA CONDICIONAL AQUÍ --- */}
              {isImageFile(preview.name) ? (
                // Si es imagen, muestra la miniatura
                <img
                  src={preview.localPreview || preview.url}
                  alt={preview.name}
                  className="h-8 w-8 rounded object-cover flex-shrink-0"
                />
              ) : (
                // Si NO es imagen (ej. PDF), muestra un ícono de archivo
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <span className="truncate text-foreground" title={preview.name}>
                {preview.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {preview.status === "uploading" && (
                <Loader className="h-4 w-4 animate-spin text-primary" />
              )}
              {preview.status === "uploaded" && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {preview.status === "error" && (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeFile(preview.id)}
                disabled={
                  (isUploading && preview.status === "uploading") || disabled
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

export default FileUploadSection;
