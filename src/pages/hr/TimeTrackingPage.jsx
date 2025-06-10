import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DataTable from '@/components/ui/data-table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/contexts/UserContext';
import { Clock, PlayCircle, StopCircle, Edit, PlusCircle, AlertTriangle, Loader2 } from 'lucide-react';

const TimeTrackingPage = () => {
  const { user } = useUser();
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [formData, setFormData] = useState({
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    is_other_project: false,
    other_project_details: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null); // Stores ID of active entry
  const { toast } = useToast();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CEO';

  const fetchTimeEntries = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from('time_tracking').select(`
      *,
      proyectos (nombre)
    `);
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }
    query = query.order('date', { ascending: false }).order('start_time', { ascending: false });
    
    const { data, error } = await query;
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los fichajes.", variant: "destructive" });
    } else {
      setTimeEntries(data.map(entry => ({
        ...entry,
        project_name: entry.proyectos?.nombre || (entry.is_other_project ? `OTROS: ${entry.other_project_details}` : 'N/A')
      })));
      // Check for an active timer for the current user
      const runningTimer = data.find(e => e.user_id === user.id && !e.end_time);
      if (runningTimer) setActiveTimer(runningTimer.id); else setActiveTimer(null);
    }
    setIsLoading(false);
  }, [toast, isAdmin, user?.id]);

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase.from('proyectos').select('uuid_id, nombre').order('nombre');
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los proyectos.", variant: "destructive" });
    } else {
      setProjects(data || []);
    }
  }, [toast]);

  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, [fetchTimeEntries, fetchProjects]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
     if (name === 'project_id' && value === 'OTROS') {
      setFormData(prev => ({ ...prev, is_other_project: true, project_id: null }));
    } else if (name === 'project_id') {
      setFormData(prev => ({ ...prev, is_other_project: false }));
    }
  };
  
  const resetFormAndClose = () => {
    setFormData({
      project_id: '', date: new Date().toISOString().split('T')[0], start_time: '', end_time: '',
      is_other_project: false, other_project_details: '', notes: '',
    });
    setCurrentEntry(null);
    setIsModalOpen(false);
  };

  const openModalForCreate = () => {
    setCurrentEntry(null);
     setFormData({
      project_id: '', date: new Date().toISOString().split('T')[0], start_time: '', end_time: '',
      is_other_project: false, other_project_details: '', notes: '',
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (entry) => {
    setCurrentEntry(entry);
    setFormData({
      project_id: entry.project_id || (entry.is_other_project ? 'OTROS' : ''),
      date: entry.date,
      start_time: entry.start_time ? new Date(entry.start_time).toISOString().substring(0, 16) : '',
      end_time: entry.end_time ? new Date(entry.end_time).toISOString().substring(0, 16) : '',
      is_other_project: entry.is_other_project,
      other_project_details: entry.other_project_details || '',
      notes: entry.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const dataToSave = {
      user_id: currentEntry ? currentEntry.user_id : user.id, // Admin can edit others
      project_id: formData.project_id === 'OTROS' || formData.is_other_project ? null : formData.project_id,
      date: formData.date,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      is_other_project: formData.project_id === 'OTROS' || formData.is_other_project,
      other_project_details: formData.is_other_project ? formData.other_project_details : null,
      notes: formData.notes,
    };
    if (isAdmin && currentEntry) dataToSave.edited_by = user.id;


    let response;
    if (currentEntry) {
      response = await supabase.from('time_tracking').update(dataToSave).eq('id', currentEntry.id).select().single();
    } else {
      response = await supabase.from('time_tracking').insert(dataToSave).select().single();
    }

    const { data, error } = response;
    if (error) {
      toast({ title: "Error", description: `No se pudo guardar el fichaje: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: currentEntry ? "Fichaje Actualizado" : "Fichaje Creado", variant: "success" });
      fetchTimeEntries();
      resetFormAndClose();
      if (data && !data.end_time) setActiveTimer(data.id); else if (currentEntry && currentEntry.id === activeTimer && data.end_time) setActiveTimer(null);
    }
    setIsLoading(false);
  };

  const handleStartTimer = async () => {
    if (activeTimer) {
        toast({ title: "Error", description: "Ya tienes un fichaje activo.", variant: "warning" });
        return;
    }
    setIsLoading(true);
    const { data, error } = await supabase.from('time_tracking').insert({
        user_id: user.id,
        project_id: formData.project_id === 'OTROS' || formData.is_other_project ? null : formData.project_id,
        date: new Date().toISOString().split('T')[0],
        start_time: new Date().toISOString(),
        is_other_project: formData.project_id === 'OTROS' || formData.is_other_project,
        other_project_details: (formData.project_id === 'OTROS' || formData.is_other_project) ? formData.other_project_details : null,
        notes: formData.notes,
    }).select().single();

    if (error) {
        toast({ title: "Error", description: `No se pudo iniciar el fichaje: ${error.message}`, variant: "destructive" });
    } else {
        toast({ title: "Fichaje Iniciado", description: "El contador ha comenzado.", variant: "success" });
        setActiveTimer(data.id);
        fetchTimeEntries(); // Refresh list
    }
    setIsLoading(false);
  };

  const handleStopTimer = async () => {
    if (!activeTimer) {
        toast({ title: "Error", description: "No hay ningún fichaje activo para detener.", variant: "warning" });
        return;
    }
    setIsLoading(true);
    const { error } = await supabase.from('time_tracking').update({
        end_time: new Date().toISOString()
    }).eq('id', activeTimer);

    if (error) {
        toast({ title: "Error", description: `No se pudo detener el fichaje: ${error.message}`, variant: "destructive" });
    } else {
        toast({ title: "Fichaje Detenido", description: "El contador se ha detenido.", variant: "success" });
        setActiveTimer(null);
        fetchTimeEntries(); // Refresh list
    }
    setIsLoading(false);
  };


  const columns = [
    { header: 'Proyecto', accessor: 'project_name', sortable: true },
    { header: 'Fecha', accessor: 'date', sortable: true },
    { header: 'Inicio', accessor: 'start_time', cell: ({row}) => new Date(row.start_time).toLocaleTimeString(), sortable: true },
    { header: 'Fin', accessor: 'end_time', cell: ({row}) => row.end_time ? new Date(row.end_time).toLocaleTimeString() : 'En curso', sortable: true },
    { header: 'Notas', accessor: 'notes' },
  ];

  if (isAdmin) {
    columns.unshift({ header: 'Usuario', accessor: 'user_id', cell: ({row}) => timeEntries.find(u => u.id === row.id)?.user_id || 'Desconocido', sortable: true }); // Placeholder for username
    columns.push({
      header: 'Acciones',
      accessor: 'actions',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => openModalForEdit(row)} className="text-primary border-primary hover:bg-primary/10">
          <Edit className="h-4 w-4 mr-1" /> Editar
        </Button>
      ),
    });
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-1"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">Control Horario</h1>
        <div className="flex gap-2">
            {!activeTimer ? (
                <Button onClick={handleStartTimer} className="bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center gap-2" disabled={isLoading}>
                    <PlayCircle className="h-5 w-5" /> Iniciar Fichaje
                </Button>
            ) : (
                <Button onClick={handleStopTimer} className="bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center gap-2" disabled={isLoading}>
                    <StopCircle className="h-5 w-5" /> Detener Fichaje
                </Button>
            )}
            {isAdmin && (
              <Button onClick={openModalForCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2">
                <PlusCircle className="h-5 w-5" /> Añadir Manual
              </Button>
            )}
        </div>
      </div>
      
      {/* Formulario para iniciar fichaje (simplificado, podría estar en un modal también) */}
      {!activeTimer && !isAdmin && (
        <motion.div layout className="p-4 border rounded-lg bg-card shadow space-y-3 mb-4">
            <h3 className="text-lg font-medium text-foreground">Nuevo Fichaje Rápido</h3>
             <div>
                <Label htmlFor="timer-project_id">Proyecto</Label>
                <Select name="project_id" value={formData.project_id} onValueChange={(value) => handleSelectChange('project_id', value)}>
                    <SelectTrigger id="timer-project_id" className="mt-1 bg-background border-input">
                    <SelectValue placeholder="Selecciona un proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                    {projects.map(p => <SelectItem key={p.uuid_id} value={p.uuid_id}>{p.nombre}</SelectItem>)}
                    <SelectItem value="OTROS">OTROS (No listado)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {(formData.project_id === 'OTROS' || formData.is_other_project) && (
                <div>
                    <Label htmlFor="timer-other_project_details">Detalles del Proyecto "OTROS"</Label>
                    <Input id="timer-other_project_details" name="other_project_details" value={formData.other_project_details} onChange={handleInputChange} className="mt-1 bg-background border-input" />
                </div>
            )}
            <div>
                <Label htmlFor="timer-notes">Notas (Opcional)</Label>
                <Textarea id="timer-notes" name="notes" value={formData.notes} onChange={handleInputChange} className="mt-1 bg-background border-input" />
            </div>
        </motion.div>
      )}


      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isOpen) resetFormAndClose(); else setIsModalOpen(true); }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary text-2xl">{currentEntry ? 'Editar Fichaje' : 'Añadir Fichaje Manual'}</DialogTitle>
            <DialogDescription>
              {currentEntry ? 'Modifica los detalles del fichaje.' : 'Completa para añadir un nuevo fichaje.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="project_id">Proyecto</Label>
              <Select name="project_id" value={formData.project_id} onValueChange={(value) => handleSelectChange('project_id', value)}>
                <SelectTrigger id="project_id" className="mt-1 bg-background border-input">
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.uuid_id} value={p.uuid_id}>{p.nombre}</SelectItem>)}
                  <SelectItem value="OTROS">OTROS (No listado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.project_id === 'OTROS' || formData.is_other_project) && (
              <div>
                <Label htmlFor="other_project_details">Detalles del Proyecto "OTROS"</Label>
                <Input id="other_project_details" name="other_project_details" value={formData.other_project_details} onChange={handleInputChange} className="mt-1 bg-background border-input" />
              </div>
            )}
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required className="mt-1 bg-background border-input" />
            </div>
            <div>
              <Label htmlFor="start_time">Hora de Inicio</Label>
              <Input id="start_time" name="start_time" type="datetime-local" value={formData.start_time} onChange={handleInputChange} required className="mt-1 bg-background border-input" />
            </div>
            <div>
              <Label htmlFor="end_time">Hora de Fin (opcional)</Label>
              <Input id="end_time" name="end_time" type="datetime-local" value={formData.end_time} onChange={handleInputChange} className="mt-1 bg-background border-input" />
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} className="mt-1 bg-background border-input" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetFormAndClose} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentEntry ? 'Guardar Cambios' : 'Crear Fichaje'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading && timeEntries.length === 0 ? (
         <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={timeEntries}
          searchableColumns={[{ accessor: 'project_name', header: 'Proyecto' }, {accessor: 'notes', header: 'Notas'}]}
          filterableColumns={isAdmin ? [{ accessor: 'user_id', header: 'Usuario' }] : []}
        />
      )}
    </motion.div>
  );
};

export default TimeTrackingPage;