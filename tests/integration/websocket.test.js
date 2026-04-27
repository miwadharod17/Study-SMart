const io = require('socket.io-client');
const http = require('http');
const { Server } = require('socket.io');

describe('WebSocket Integration Tests', () => {
    let serverSocket;
    let clientSocket;
    let httpServer;
    let ioServer;

    beforeAll((done) => {
        httpServer = http.createServer();
        ioServer = new Server(httpServer);
        
        ioServer.on('connection', (socket) => {
            serverSocket = socket;
            
            socket.on('test_message', (data) => {
                socket.emit('test_response', { received: data });
            });
            
            socket.on('join_room', (room) => {
                socket.join(room);
                socket.emit('joined', { room });
            });
        });
        
        httpServer.listen(3004, () => {
            clientSocket = io('http://localhost:3004');
            clientSocket.on('connect', done);
        });
    });

    afterAll(() => {
        ioServer.close();
        httpServer.close();
        clientSocket.close();
    });

    test('should establish connection', (done) => {
        expect(clientSocket.connected).toBe(true);
        done();
    });

    test('should send and receive messages', (done) => {
        clientSocket.emit('test_message', { text: 'Hello Server' });
        
        clientSocket.on('test_response', (data) => {
            expect(data.received.text).toBe('Hello Server');
            done();
        });
    });

    test('should join and receive room events', (done) => {
        clientSocket.emit('join_room', 'test-room');
        
        clientSocket.on('joined', (data) => {
            expect(data.room).toBe('test-room');
            done();
        });
    });
});