// vite.config.js
import { defineConfig } from 'vite'
import { multi } from 'vite-plugin-multi-pages';

export default defineConfig({
  base: './',
  plugins: [
    multi({
      pages: {
        index: 'index.html',
        404: '404.html',
      }
    })
  ]
});