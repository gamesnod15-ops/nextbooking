/// <reference types="vite/client" />

// Allow CSS module imports
declare module '*.css' {
  const css: Record<string, string>
  export default css
}
