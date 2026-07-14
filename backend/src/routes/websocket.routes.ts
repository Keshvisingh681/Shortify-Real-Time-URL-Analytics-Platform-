import { FastifyInstance } from 'fastify';
import { socketManager } from '../websocket/socket.manager';

export async function websocketRoutes(fastify: FastifyInstance) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    socketManager.addConnection(connection);
    
    connection.socket.on('message', (message: any) => {
      try {
        const parsed = JSON.parse(message.toString());
        console.log('WS message received:', parsed);
        // We can handle specific actions from frontend if necessary
      } catch (err) {
        console.log('WS client raw message:', message.toString());
      }
    });
  });
}
