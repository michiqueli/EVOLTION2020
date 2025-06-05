import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Car, Settings } from 'lucide-react';
import UserManagement from '@/components/settings/UserManagement';
import VehicleManagement from '@/components/settings/VehicleManagement';

const GlobalSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("userManagement");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 space-y-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Configuración Global
          </h1>
          <p className="text-md text-muted-foreground">
            Administra usuarios, vehículos y otras configuraciones del sistema.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:w-fit mb-6 bg-muted p-1 rounded-lg">
          <TabsTrigger value="userManagement" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2.5 text-sm font-medium">
            <UserCog className="h-5 w-5" />
            Gestión de Usuarios
          </TabsTrigger>
          <TabsTrigger value="vehicleManagement" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2.5 text-sm font-medium">
            <Car className="h-5 w-5" />
            Gestión de Vehículos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="userManagement">
          <motion.div
            key="userManagement"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <UserManagement />
          </motion.div>
        </TabsContent>
        <TabsContent value="vehicleManagement">
          <motion.div
            key="vehicleManagement"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <VehicleManagement />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default GlobalSettingsPage;