const socketio = require('socket.io');

const { ioSigninRequired } = require('./middlewares/auth');
const authController = require('./controllers/auth.controller')
const roomController = require('./controllers/room.controller');
const messageController = require('./controllers/message.controller');

module.exports = server => {

    const io = socketio(server);

    io.use(ioSigninRequired);

    io.on('connection', socket => {
        console.log(`${socket.user.username} connected.`);

        socket.on('edit profile', (data, callback) => {
            authController.editUser(socket, data, callback);
        });

        socket.on('change profile picture', (data, callback) => {
            authController.changeProfilePicture(socket, data, callback);
        });

        socket.on('change password', (data, callback) => {
            authController.changePassword(socket, data, callback);
        });

        socket.on('delete acount', callback => {
            authController.deleteAcount(socket, callback);
        });

        socket.on('create new room', (data, callback) => {
            roomController.createNewRoom(socket, data, callback);
        });

        socket.on('edit room', (data, callback) => {
            roomController.editRoom(socket, data, callback);
        });

        socket.on('leave room', (data, callback) => {
            roomController.leaveRoom(socket, data, callback);
        });

        socket.on('delete room', (data, callback) => {
            roomController.deleteRoom(socket, data, callback);
        });

        socket.on('get rooms', (data,callback) => {
            roomController.getRooms(socket, data, callback);
        });

        socket.on('get room', (data,callback) => {
            roomController.getRoom(socket, data, callback);
        });

        socket.on('join room', (data, callback) => {
            roomController.joinRoom(socket, data, callback);
        });

        socket.on('get room members', (data, callback) => {
            roomController.getRoomMembers(socket, data, callback);
        });

        socket.on('get messages', (data, callback) => {
            messageController.getMessages(socket, data, callback);
        });

        socket.on('send message', data => {
            messageController.sendMessage(io, socket, data);
        });

        socket.on('edit message', data => {
            messageController.editMessage(io, socket, data);
        });

        socket.on('delete message', data => {
            messageController.deleteMessage(io, socket, data);
        });

        socket.on('disconnect', () => {
            authController.logout(socket);
            console.log(`${socket.user.username} disconnected.`);
        });
    });
};