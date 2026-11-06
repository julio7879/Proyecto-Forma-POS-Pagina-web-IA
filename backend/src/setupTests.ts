import dotenv from 'dotenv';
import path from 'path';

// Cargar .env de backend explícitamente en todas las pruebas de Vitest
dotenv.config({ path: path.resolve(__dirname, '../.env') });
