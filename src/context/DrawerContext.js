import React, { createContext, useContext, useState } from "react";

const DrawerContext = createContext();

export function DrawerProvider({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  return (
    <DrawerContext.Provider value={{ isDrawerOpen, setIsDrawerOpen }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext);
}
