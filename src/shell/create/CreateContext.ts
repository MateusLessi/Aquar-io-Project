import { createContext, useContext } from 'react';

/** Opens the create chooser from anywhere inside the shell (e.g. the dashboard's button). */
export const CreateContext = createContext<() => void>(() => {});

export const useCreate = () => useContext(CreateContext);
