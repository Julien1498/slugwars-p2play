import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const reactAliases = {
  react: path.resolve(__dirname, "node_modules/react"),
  "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
  "react-dom/client": path.resolve(__dirname, "node_modules/react-dom/client"),
  "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime.js"),
  "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime.js"),
};

export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";
  return {
    base: "./",
    plugins: [react()],
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
        ...(isLib ? reactAliases : {}),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env": "{}",
    },
    build: isLib
      ? {
          outDir: "dist",
          lib: {
            entry: path.resolve(__dirname, "src/main.tsx"),
            name: "GameSlugwars",
            formats: ["es"],
            fileName: () => "index.js",
          },
          rollupOptions: {
            output: { assetFileNames: "style.css" },
          },
        }
      : {
          outDir: "dist",
        },
  };
});
