/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY: string;
  readonly VITE_CLAUDE_MODEL?: string;
  readonly VITE_TINYMCE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

