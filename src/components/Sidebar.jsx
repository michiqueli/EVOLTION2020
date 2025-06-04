import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, Briefcase, ListChecks, BookOpen, BarChart2, User, Settings, LogOut, Menu, X, MessageSquare, Users as UsersIcon, ShieldCheck } from 'lucide-react'; // Added UsersIcon, ShieldCheck
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser, ROLES } from '@/contexts/UserContext';

const allNavItems = [
  { to: '/dashboard', label: 'Inicio', icon: Home, roles: [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR, ROLES.WORKER] },
  { to: '/planning', label: 'Planificación', icon: CalendarDays, roles: [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR, ROLES.WORKER] },
  { to: '/projects', label: 'Proyectos', icon: Briefcase, roles: [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR, ROLES.WORKER] },
  { to: '/activities', label: 'Actividades', icon: ListChecks, roles: [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR, ROLES.WORKER] },
  { to: '/assistant', label: 'ChatEVO', icon: MessageSquare, roles: [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR, ROLES.WORKER] },
  // Library access for technicians, supervisors, admin, ceo as per instructions
  { to: '/library', label: 'Biblioteca', icon: BookOpen, roles: [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR, ROLES.WORKER] }, 
  { to: '/reports', label: 'Reportes', icon: BarChart2, roles: [ROLES.ADMIN, ROLES.CEO] }, // Only Admin/CEO for main reports
  // Consider adding a "Team Reports" or similar for Supervisors if needed as a separate menu item
  { to: '/admin/users', label: 'Gestión Usuarios', icon: UsersIcon, roles: [ROLES.ADMIN, ROLES.CEO] }, // Example for user management
  { to: '/admin/settings', label: 'Config. Global', icon: ShieldCheck, roles: [ROLES.ADMIN, ROLES.CEO] }, // Example for global settings
];


const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); 
  };

  const getNavItems = () => {
    if (!user) return [];
    return allNavItems.filter(item => item.roles.includes(user.role));
  };

  const navItems = getNavItems();

  const sidebarVariants = {
    open: { width: '16rem', transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { width: '5rem', transition: { type: 'spring', stiffness: 300, damping: 30 } },
  };

  const NavItem = ({ to, label, icon: Icon }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all duration-150 ease-in-out',
          isActive
            ? 'bg-primary text-primary-foreground shadow-lg'
            : 'text-foreground hover:bg-secondary hover:text-secondary-foreground',
          !isOpen && 'justify-center' 
        )
      }
      onClick={toggleSidebar && isOpen && window.innerWidth < 768 ? toggleSidebar : undefined}
    >
      <Icon className={cn('h-6 w-6 flex-shrink-0', !isOpen && 'h-7 w-7')} />
      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
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

  if (!user) return null; 

  return (
    <motion.div
      variants={sidebarVariants}
      initial={false} 
      animate={isOpen ? "open" : "closed"}
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-full transform flex-col border-r border-border bg-background shadow-xl md:relative md:translate-x-0 print:hidden',
      )}
      style={ window.innerWidth < 768 ? { transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' } : {} }
    >
      <div className={cn('flex h-16 items-center border-b border-border p-4', isOpen ? 'justify-between' : 'justify-center')}>
        {isOpen && (
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-primary"
          >
            EVOLTION2020
          </motion.h1>
        )}
         <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-foreground hover:text-primary">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className={cn('mt-auto border-t border-border p-3', !isOpen && 'py-3')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn('w-full justify-start p-2 hover:bg-secondary', !isOpen && 'h-14 w-14 justify-center')}>
              <Avatar className={cn('h-9 w-9 border-2 border-primary flex-shrink-0', !isOpen && 'h-10 w-10')}>
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <AnimatePresence>
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: 'auto', marginLeft: '0.75rem' }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3 flex flex-col items-start overflow-hidden whitespace-nowrap"
                >
                  <span className="text-sm font-medium text-foreground">{user.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </motion.div>
              )}
              </AnimatePresence>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align={isOpen ? "end" : "center"} side="right" sideOffset={isOpen ? 0 : 20}>
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink to="/profile" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </NavLink>
            </DropdownMenuItem>
            {(user.role === ROLES.ADMIN || user.role === ROLES.CEO) && (
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-destructive hover:!bg-destructive/10 hover:!text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
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