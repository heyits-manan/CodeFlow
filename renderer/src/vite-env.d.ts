/// <reference types="vite/client" />

import { IElectronAPI } from "../../interface";

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
