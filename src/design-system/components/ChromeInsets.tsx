import { createContext, useContext } from 'react';

/** Space taken by floating navigation chrome, which screens must keep their content clear of. */
export type ChromeInsets = { bottom: number };

const ChromeInsetsContext = createContext<ChromeInsets>({ bottom: 0 });

/** Provided by the app shell; read by `Screen`. */
export const ChromeInsetsProvider = ChromeInsetsContext.Provider;

export function useChromeInsets(): ChromeInsets {
  return useContext(ChromeInsetsContext);
}
