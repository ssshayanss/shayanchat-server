const Message = require('../models/message.model');
const Room = require('../models/room.model');
const User = require('../models/user.model');
const { getCurrentDate, groupday } = require('../functions');

module.exports = {
    getMessages: async (socket, data, callback) => {
        try {
            const { roomId } = await data;
            const room = await Room.findOne({ id: roomId }).populate('messages');
            if(!room) callback({ success: false, error: 'گروه یافت نشد', messages: {} });
            else if(room.members.includes(socket.user._id)) {
                const messages = [];
                for(let i=0; i<room.messages.length; i++) {
                    const sender = await User.findById(room.messages[i].sender);
                    const messageData = {
                        id: room.messages[i]._id,
                        sender: {
                            name: sender ? sender.name : 'deleted account',
                            profilePicture: (sender && sender.profilePicture) ? sender.profilePicture : null,
                        },
                        text: room.messages[i].text,
                        date: room.messages[i].date,
                        createdAt: room.messages[i].createdAt,
                        isOwner: (room.messages[i].sender._id.toString()===socket.user._id.toString())
                    };
                    messages.push(messageData);
                }
                const sortedMessages = await groupday(messages); 
                callback({ success: true, messages: sortedMessages });
            } else callback({ success: false, error: 'ابتدا عضو گروه شوید', messages: {} });
        } catch (error) {
            callback({ success: false, error: 'خطای سرور!!!' });
        }
    },
    sendMessage: async (io, socket, data) => {
        try {
            const { message, roomId } = await data;
            const fullDate = getCurrentDate();
            const newMessage = new Message({
                sender: socket.user._id,
                text: message,
                date: fullDate
            });
            await newMessage.save();
            await Room.findOneAndUpdate({ id: roomId }, {$push: {"messages": newMessage}});
            const sender = await User.findById(socket.user._id);
            const newMessageData = {
                id: newMessage._id,
                sender: {
                    name: sender.name,
                    profilePicture: sender.profilePicture ? sender.profilePicture : null,
                    email: sender.email
                },
                text: newMessage.text,
                date: newMessage.date,
                createdAt: newMessage.createdAt
            };
            io.in(roomId).emit('new message', { roomId, newMessage: newMessageData });
        } catch (error) {}
    },
    editMessage: async (io, socket, data) => {
        try {
            const { message, roomId, messageId } = await data;
            const updateMessage = await Message.findById(messageId).populate('sender');
            if(updateMessage.sender._id.toString() === socket.user._id.toString()) {
                await updateMessage.updateOne({ text: message });
                const updatedMessage = await Message.findById(messageId).populate('sender');
                const updateMessageData = {
                    id: updatedMessage._id,
                    sender: {
                        name: updatedMessage.sender.name,
                        profilePicture: updatedMessage.sender.profilePicture ? updatedMessage.sender.profilePicture : null,
                        email: updatedMessage.sender.email
                    },
                    text: updatedMessage.text,
                    date: updatedMessage.date,
                    createdAt: updatedMessage.createdAt
                };
                io.in(roomId).emit('new message', { roomId, updateMessage: updateMessageData });
            }
        } catch (error) {
            console.log(error);
        }
    },
    deleteMessage: async (io, socket, data) => {
        try {
            const { roomId, messageId } = await data;
            const message = await Message.findById(messageId).populate('sender');
            if(message.sender._id.toString() === socket.user._id.toString()) {
                await message.remove();
                const room = await Room.findOne({ id: roomId });
                const messageIndex = await room.messages.indexOf(messageId);
                if(messageIndex !== -1) await room.messages.splice(messageIndex, 1);
                await room.save();
                io.in(roomId).emit('new message', { roomId, deleteMessage: { id: message._id, date: message.date } });
            }
        } catch (error) {}
    }
}