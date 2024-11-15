import net from 'net';
import { onConnection } from './events/onConnection.js';
import { initServer } from './init/initServer.js';
import { config } from './config/config.js';

const server = net.createServer(onConnection);

initServer().then(() => {
  server.listen(config.server.port, config.server.host, () => {
    console.log(`SERVER ON - ${config.server.host} : ${config.server.port}`);
  });
});
