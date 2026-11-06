import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor POS + Tienda Web escuchando en 0.0.0.0:${env.PORT} [${env.NODE_ENV}]`);
});
