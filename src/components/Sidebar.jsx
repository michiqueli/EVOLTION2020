import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  CalendarDays,
  Briefcase,
  ListChecks,
  BarChart2,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  User,
  Settings,
  Users as UsersIcon,
  Clock,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser, ROLES } from "@/contexts/UserContext";

// 1. ESTRUCTURA DE CONFIGURACIÓN REORGANIZADA PARA SOPORTAR GRUPOS
const sidebarConfig = [
  {
    to: "/dashboard",
    label: "Inicio",
    icon: Home,
    roles: [
      ROLES.ADMIN,
      ROLES.CEO,
      ROLES.SUPERVISOR,
      ROLES.WORKER,
      ROLES.DEVELOPER,
    ],
  },
  {
    type: "group",
    label: "Zona de Trabajo",
    icon: Briefcase,
    roles: [
      ROLES.ADMIN,
      ROLES.CEO,
      ROLES.SUPERVISOR,
      ROLES.WORKER,
      ROLES.DEVELOPER,
    ],
    subItems: [
      {
        to: "/planning",
        label: "Planificación",
        icon: CalendarDays,
        roles: [
          ROLES.ADMIN,
          ROLES.CEO,
          ROLES.SUPERVISOR,
          ROLES.WORKER,
          ROLES.DEVELOPER,
        ],
      },
      {
        to: "/projects",
        label: "Proyectos",
        icon: Briefcase,
        roles: [
          ROLES.ADMIN,
          ROLES.CEO,
          ROLES.SUPERVISOR,
          ROLES.WORKER,
          ROLES.DEVELOPER,
        ],
      },
      {
        to: "/activities",
        label: "Informes",
        icon: ListChecks,
        roles: [
          ROLES.ADMIN,
          ROLES.CEO,
          ROLES.SUPERVISOR,
          ROLES.WORKER,
          ROLES.DEVELOPER,
        ],
      },
    ],
  },
  {
    type: "group",
    label: "RR HH",
    icon: UsersIcon,
    roles: [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR],
    subItems: [
      {
        to: "/hr/resources",
        label: "Gestión de recursos",
        icon: UsersIcon,
        roles: [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR],
      },
      {
        to: "/hr/time-tracking",
        label: "Control Horario",
        icon: Clock,
        roles: [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR],
      },
      {
        to: "/hr/absences",
        label: "Gestión de Ausencias",
        icon: UserMinus,
        roles: [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR],
      },
    ],
  },
  {
    to: "/reports",
    label: "Reportes",
    icon: BarChart2,
    roles: [ROLES.ADMIN, ROLES.CEO, ROLES.DEVELOPER],
  },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 2. LÓGICA DE FILTRADO ACTUALIZADA PARA LA ESTRUCTURA ANIDADA
  const getVisibleItems = () => {
    if (!user || !user.role) return [];

    return sidebarConfig.reduce((acc, item) => {
      // Si es un grupo de acordeón
      if (item.type === "group") {
        // Filtra los sub-items que el usuario puede ver
        const visibleSubItems = item.subItems.filter((subItem) =>
          subItem.roles.includes(user.role)
        );
        // Si hay al menos un sub-item visible, añade el grupo al menú
        if (visibleSubItems.length > 0) {
          acc.push({ ...item, subItems: visibleSubItems });
        }
      } else {
        // Si es un enlace normal, comprueba los roles
        if (item.roles.includes(user.role)) {
          acc.push(item);
        }
      }
      return acc;
    }, []);
  };

  const navItems = getVisibleItems();

  const sidebarVariants = {
    open: {
      width: "16rem",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    closed: {
      width: "5rem",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  // El componente NavItem se mantiene casi igual, es reutilizable
  const NavItem = ({ to, label, icon: Icon, className }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all duration-150 ease-in-out",
          isActive
            ? "bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg scale-105"
            : "text-foreground hover:bg-muted hover:text-foreground",
          !isOpen && "justify-center",
          className
        )
      }
      onClick={
        toggleSidebar && isOpen && window.innerWidth < 768
          ? toggleSidebar
          : undefined
      }
    >
      <Icon className={cn("h-6 w-6 flex-shrink-0", !isOpen && "h-7 w-7")} />
      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );

  // Componente para el encabezado del acordeón
  const AccordionTriggerItem = ({ label, icon: Icon }) => (
    <div
      className={cn(
        "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-base font-medium text-foreground",
        !isOpen && "justify-center"
      )}
    >
      <Icon className={cn("h-6 w-6 flex-shrink-0", !isOpen && "h-7 w-7")} />
      {isOpen && (
        <span className="overflow-hidden whitespace-nowrap">{label}</span>
      )}
    </div>
  );

  if (!user) return null;

  return (
    <motion.div
      variants={sidebarVariants}
      initial={false}
      animate={isOpen ? "open" : "closed"}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full transform flex-col border-r border-border bg-card shadow-xl md:relative md:translate-x-0 print:hidden"
      )}
      style={
        window.innerWidth < 768
          ? { transform: isOpen ? "translateX(0)" : "translateX(-100%)" }
          : {}
      }
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border p-4",
          isOpen ? "justify-between" : "justify-center"
        )}
      >
        {isOpen && (
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500"
          >
            EVOLTION2020
          </motion.h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-foreground hover:text-primary"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* 3. RENDERIZADO DEL MENÚ CON ACORDEONES */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
        <Accordion type="multiple" className="w-full">
          {navItems.map((item) =>
            item.type === "group" ? (
              // Si está abierto, renderiza un acordeón
              isOpen ? (
                <AccordionItem
                  value={item.label}
                  key={item.label}
                  className="border-b-0"
                >
                  <AccordionTrigger className="hover:no-underline hover:bg-muted rounded-lg p-0">
                    <AccordionTriggerItem label={item.label} icon={item.icon} />
                  </AccordionTrigger>
                  <AccordionContent className="pl-6 pr-2 pt-1 pb-0">
                    <div className="space-y-1.5">
                      {item.subItems.map((subItem) => (
                        <NavItem key={subItem.to} {...subItem} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                // Si está cerrado, solo muestra el icono del grupo
                <AccordionTriggerItem
                  key={item.label}
                  label={item.label}
                  icon={item.icon}
                />
              )
            ) : (
              // Si es un item normal, lo renderiza como siempre
              <NavItem key={item.to} {...item} />
            )
          )}
        </Accordion>
      </nav>

      {/* El footer con el perfil de usuario se mantiene igual */}
      <div
        className={cn("mt-auto border-t border-border p-3", !isOpen && "py-3")}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start p-2 hover:bg-muted",
                !isOpen && "h-14 w-14 justify-center"
              )}
            >
              <Avatar
                className={cn(
                  "h-9 w-9 border-2 border-primary flex-shrink-0",
                  !isOpen && "h-10 w-10"
                )}
              >
                <AvatarImage
                  src={
                    user.avatarUrl ||
                    `https://avatar.vercel.sh/${user.email}.png`
                  }
                  alt={user.name}
                />
                <AvatarFallback>
                  {user.name
                    ? user.name.charAt(0).toUpperCase()
                    : user.email
                    ? user.email.charAt(0).toUpperCase()
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                    animate={{
                      opacity: 1,
                      width: "auto",
                      marginLeft: "0.75rem",
                    }}
                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 flex flex-col items-start overflow-hidden whitespace-nowrap"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {user.name || user.email}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {user.role}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 mb-2"
            align={isOpen ? "end" : "center"}
            side="top"
            sideOffset={isOpen ? 10 : 15}
          >
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink
                to="/profile"
                className="flex items-center cursor-pointer w-full"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </NavLink>
            </DropdownMenuItem>
            {(user.role === ROLES.ADMIN ||
              user.role === ROLES.CEO ||
              user.role === ROLES.DEVELOPER) && (
              <DropdownMenuItem
                className="cursor-pointer w-full"
                onClick={() => navigate("/admin/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive hover:!bg-destructive/10 hover:!text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default Sidebar;
