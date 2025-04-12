import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      external: ["mock-aws-s3", "aws-sdk", "nock", "node-pre-gyp"],
    },
  },
  plugins: [react()],
});
