import net from 'net';
import { onConnection } from './events/onConnection.js';
import { initServer } from './init/initServer.js';
import { config } from './config/config.js';
import express from 'express';
import sessionRouter from './routes/session.router.js';
import errorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const server = net.createServer(onConnection);
const app = express();

app.use(express.json());
app.use('/', sessionRouter);
app.use(errorHandlingMiddleware);

initServer().then(() => {
  server.listen(config.server.port, config.server.host, () => {
    console.log(`SERVER ON - ${config.server.host} : ${config.server.port}`);
  });
  app.listen(config.server.apiPort, config.server.host, () => {
    console.log(`API ON - ${config.server.host}:${config.server.apiPort}`);
  });
});
