import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useUser(); // Updated to use generic login
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        throw signInError;
      }

      if (signInData.user) {
        // User is authenticated with Supabase, now fetch profile from 'usuarios' table
        const { data: userProfile, error: profileError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('user_id', signInData.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows
          // Other error fetching profile
          throw profileError;
        }
        
        if (!userProfile) {
          await supabase.auth.signOut(); // Log out Supabase session
          setError('Tu perfil no fue encontrado. Por favor, contacta a soporte.');
          toast({ title: "Error de Perfil", description: "No se encontró tu perfil de usuario.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        // Check user status
        if (userProfile.estado === 'pendiente') {
          await supabase.auth.signOut();
          setError('Tu cuenta está pendiente de aprobación. Te avisaremos cuando esté lista.');
          toast({ title: "Cuenta Pendiente", description: "Tu acceso aún no ha sido aprobado.", variant: "default", duration: 7000 });
          setIsLoading(false);
          return;
        } else if (userProfile.estado === 'rechazado') {
          await supabase.auth.signOut();
          setError('Tu solicitud de acceso fue rechazada.');
          toast({ title: "Acceso Denegado", description: "Tu solicitud de acceso fue rechazada.", variant: "destructive", duration: 7000 });
          setIsLoading(false);
          return;
        } else if (userProfile.estado !== 'aceptado') {
          await supabase.auth.signOut();
          setError('Estado de cuenta inválido. Contacta a soporte.');
          toast({ title: "Error de Cuenta", description: "Tu cuenta tiene un estado no reconocido.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        // User is 'aceptado', proceed with app login
        const appUser = {
          id: userProfile.user_id, // Supabase auth ID
          supabase_id: userProfile.user_id, // Explicitly Supabase auth ID
          db_id: userProfile.id, // ID from public.usuarios table
          name: userProfile.nombre,
          role: userProfile.rol,
          email: signInData.user.email, // Email from Supabase auth
          avatarUrl: signInData.user.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${userProfile.user_id}`, // Example avatar
          // Add any other relevant fields from userProfile
        };
        
        login(appUser); // This function should now set the user in UserContext

        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido de nuevo.",
          variant: "success",
        });
        navigate('/dashboard');

      }
    } catch (err) {
      console.error("Login error:", err);
      let displayError = 'Error de inicio de sesión. Verifica tus credenciales o contacta a soporte.';
      if (err.message.includes("Invalid login credentials")) {
        displayError = 'Nombre de usuario o contraseña incorrectos.';
      } else if (err.message.includes("Email not confirmed")) {
        displayError = 'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
      }
      setError(displayError);
      toast({
        title: "Error de inicio de sesión",
        description: displayError,
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
          Accede a tu cuenta para continuar
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
            <Label htmlFor="email" className="text-base font-medium text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
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
              placeholder="••••••••"
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
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Iniciar Sesión
              </>
            )}
          </Button>
        </form>
        
        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta? <Link to="/register" className="font-medium text-primary hover:underline">Regístrate aquí</Link>
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Problemas para acceder? <a href="#" className="font-medium text-primary hover:underline">Contacta con soporte</a>.
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

export default LoginPage;
