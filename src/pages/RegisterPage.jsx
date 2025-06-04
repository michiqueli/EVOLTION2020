import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableRoles = [
    { value: 'worker', label: 'TÉCNICO' },
    { value: 'admin', label: 'ADMINISTRADOR' },
    { value: 'developer', label: 'DESARROLLADOR' },
  ];


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setIsLoading(false);
      toast({ title: "Error de Registro", description: "La contraseña debe tener al menos 6 caracteres.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setIsLoading(false);
      toast({ title: "Error de Registro", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    if (!selectedRole) {
      setError('Por favor, selecciona un rol.');
      setIsLoading(false);
      toast({ title: "Error de Registro", description: "Debes seleccionar un rol.", variant: "destructive" });
      return;
    }
    if (!fullName.trim()) {
      setError('Por favor, ingresa tu nombre completo.');
      setIsLoading(false);
      toast({ title: "Error de Registro", description: "El nombre completo es requerido.", variant: "destructive" });
      return;
    }


    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (signUpData.user) {
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert([
            {
              user_id: signUpData.user.id,
              nombre: fullName,
              rol: selectedRole,
              estado: 'pendiente',
            }
          ]);

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          // Attempt to delete the auth user if profile insert fails to avoid orphaned auth users
          // This is a best-effort, might fail if RLS/permissions prevent it or if user is already confirmed.
          // Consider a cleanup mechanism or admin intervention for such cases.
          await supabase.auth.admin.deleteUser(signUpData.user.id).catch(delErr => {
            console.error("Failed to delete orphaned auth user:", delErr);
          });
          throw new Error(`Error al crear el perfil de usuario: ${profileError.message}. Por favor, intenta registrarte de nuevo o contacta a soporte.`);
        }

        toast({
          title: "Registro Exitoso",
          description: "Tu cuenta ha sido creada y está pendiente de aprobación por un administrador.",
          variant: "success",
          duration: 7000,
        });
        navigate('/'); 
      } else if (signUpData.session === null && !signUpData.user) {
        // This case might indicate an issue like user already registered but unconfirmed,
        // or other specific Supabase responses.
        // Supabase's signUp behavior can vary based on email confirmation settings.
        // If email confirmation is ON, signUpData.user will exist, signUpData.session will be null.
        // The current logic handles this by creating the profile and setting to 'pendiente'.
        // This specific else-if might be for unexpected scenarios.
        setError("No se pudo completar el registro. El usuario podría ya existir o requerir confirmación de email.");
        toast({
          title: "Registro Incompleto",
          description: "No se pudo completar el registro. Verifica tu email o intenta más tarde.",
          variant: "default",
          duration: 7000,
        });
      } else {
        // Fallback for other unexpected responses from signUp
         setError("Respuesta inesperada del servidor de autenticación.");
         toast({
          title: "Error de Registro",
          description: "Respuesta inesperada del servidor. Intenta más tarde.",
          variant: "destructive",
        });
      }

    } catch (err) {
      let displayMessage = err.message || 'Ocurrió un error durante el registro.';
      if (err.message && err.message.includes("User already registered")) {
        displayMessage = "Este email ya está registrado. Intenta iniciar sesión o recuperar tu contraseña.";
      } else if (err.message && err.message.includes("Password should be at least 6 characters")) {
        displayMessage = "La contraseña debe tener al menos 6 caracteres.";
      }
      setError(displayMessage);
      toast({
        title: "Error de Registro",
        description: displayMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-secondary p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        className="mb-8 text-center"
      >
        <h1 className="text-5xl sm:text-6xl font-extrabold text-primary">
          EVOLTION2020
        </h1>
        <p className="mt-2 text-lg sm:text-xl text-muted-foreground">
          Crea tu cuenta para unirte
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md p-6 sm:p-8 bg-card rounded-xl shadow-2xl border border-border"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="fullName" className="text-base font-medium text-foreground">Nombre Completo</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ej: Juan Pérez García"
              required
              className="mt-1 text-base"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-base font-medium text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ej: juan.perez@evoltion2020.com"
              required
              className="mt-1 text-base"
            />
          </div>
          
          <div className="relative">
            <Label htmlFor="password" className="text-base font-medium text-foreground">Contraseña</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className="mt-1 text-base pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-[calc(50%_-_0.1rem)] h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>

          <div className="relative">
            <Label htmlFor="confirmPassword" className="text-base font-medium text-foreground">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              className="mt-1 text-base pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-[calc(50%_-_0.1rem)] h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>

          <div>
            <Label htmlFor="role" className="text-base font-medium text-foreground">Rol Deseado</Label>
            <Select onValueChange={setSelectedRole} value={selectedRole} required>
              <SelectTrigger id="role" className="mt-1 text-base">
                <SelectValue placeholder="Selecciona un rol..." />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {error && (
            <motion.p 
              initial={{opacity: 0, y: -10}}
              animate={{opacity: 1, y: 0}}
              className="text-sm font-medium text-destructive text-center"
            >
              {error}
            </motion.p>
          )}

          <Button 
            type="submit" 
            className="w-full text-base py-3 h-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 ease-in-out shadow-lg hover:shadow-primary/40 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                Registrarse
              </>
            )}
          </Button>
        </form>
        
        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta? <Link to="/" className="font-medium text-primary hover:underline">Inicia sesión aquí</Link>.
        </p>
      </motion.div>
      
      <motion.p 
        initial={{opacity: 0}}
        animate={{opacity:1}}
        transition={{delay: 0.5, duration:0.5}}
        className="mt-12 text-sm text-muted-foreground"
      >
        &copy; {new Date().getFullYear()} EVOLTION2020. Todos los derechos reservados.
      </motion.p>
    </div>
  );
};

export default RegisterPage;
