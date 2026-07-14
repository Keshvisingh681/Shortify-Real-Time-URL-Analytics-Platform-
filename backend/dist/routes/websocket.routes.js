"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketRoutes = websocketRoutes;
const socket_manager_1 = require("../websocket/socket.manager");
async function websocketRoutes(fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
        socket_manager_1.socketManager.addConnection(connection);
        connection.socket.on('message', (message) => {
            try {
                const parsed = JSON.parse(message.toString());
                console.log('WS message received:', parsed);
                // We can handle specific actions from frontend if necessary
            }
            catch (err) {
                console.log('WS client raw message:', message.toString());
            }
        });
    });
}
