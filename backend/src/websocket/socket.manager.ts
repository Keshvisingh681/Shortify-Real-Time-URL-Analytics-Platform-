export class SocketManager {
  private connections = new Set<any>();

  addConnection(connection: any) {
    this.connections.add(connection);
    
    connection.socket.on('close', () => {
      this.connections.delete(connection);
      console.log(`🔌 Connection closed. Total clients: ${this.connections.size}`);
    });

    console.log(`🔌 New client connected. Total clients: ${this.connections.size}`);
  }

  broadcast(event: string, payload: any) {
    const data = JSON.stringify({ event, payload });
    for (const conn of this.connections) {
      if (conn.socket.readyState === 1) { // OPEN
        conn.socket.send(data);
      }
    }
  }
}

export const socketManager = new SocketManager();
