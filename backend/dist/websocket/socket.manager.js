"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketManager = exports.SocketManager = void 0;
class SocketManager {
    connections = new Set();
    addConnection(connection) {
        this.connections.add(connection);
        connection.socket.on('close', () => {
            this.connections.delete(connection);
            console.log(`🔌 Connection closed. Total clients: ${this.connections.size}`);
        });
        console.log(`🔌 New client connected. Total clients: ${this.connections.size}`);
    }
    broadcast(event, payload) {
        const data = JSON.stringify({ event, payload });
        for (const conn of this.connections) {
            if (conn.socket.readyState === 1) { // OPEN
                conn.socket.send(data);
            }
        }
    }
}
exports.SocketManager = SocketManager;
exports.socketManager = new SocketManager();
