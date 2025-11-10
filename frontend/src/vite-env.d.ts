/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Agrega aquí cualquier otra variable de entorno que uses con VITE_
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}