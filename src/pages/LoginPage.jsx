import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, authError, clearAuthError } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Estado para errores del formulario
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Si aparece un error de lógica de negocio en el contexto...
    if (authError) {
      setError(authError); // Lo mostramos en el formulario
      toast({
        // Y en una notificación
        title: "Acceso Denegado",
        description: authError,
        variant: "destructive",
        duration: 7000,
      });
      clearAuthError(); // Limpiamos el error para que no vuelva a aparecer
    }
  }, [authError, clearAuthError, toast]);

  // useEffect para el mensaje de registro exitoso (este ya lo tenías)
  useEffect(() => {
    if (location.state?.message) {
      toast({
        title: "Información",
        description: location.state.message,
        variant: "success",
        duration: 7000,
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // El submit ahora solo se preocupa de errores de bajo nivel (ej. contraseña)
    const { error: signInError } = await login({ email, password });

    setIsLoading(false);

    if (signInError) {
      let displayError =
        "Credenciales inválidas. Por favor, verifica tus datos.";
      if (signInError.message.includes("Email not confirmed")) {
        displayError = "Por favor, confirma tu correo electrónico.";
      }
      setError(displayError);
    }
    // Ya no hay 'else'. Si el login es exitoso, los useEffects se encargan de todo.
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-secondary p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
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
            <Label
              htmlFor="email"
              className="text-base font-medium text-foreground"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              omPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData
                  .getData("text")
                  .trim()
                  .toLowerCase();
                setEmail(pastedText);
              }}
              placeholder="tu@email.com"
              required
              className="mt-1 text-base"
            />
          </div>

          <div className="relative">
            <Label
              htmlFor="password"
              className="text-base font-medium text-foreground"
            >
              Contraseña
            </Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              omPaste={(e) => {
                e.preventDefault();
                const pastedPass = e.clipboardData
                  .getData("text")
                  .trim()
                  .toLowerCase();
                setPassword(pastedPass);
              }}
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
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </Button>
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
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
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Problemas para acceder?{" "}
          <a href="#" className="font-medium text-primary hover:underline">
            Contacta con soporte
          </a>
          .
        </p>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-12 text-sm text-muted-foreground"
      >
        &copy; {new Date().getFullYear()} EVOLTION2020. Todos los derechos
        reservados.
      </motion.p>
    </div>
  );
};

export default LoginPage;
