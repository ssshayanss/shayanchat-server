const Room = require('../models/room.model');
const User = require('../models/user.model');
const { validateImageFile, uploadImage, deleteImage } = require('../functions');

module.exports = {
    createNewRoom: async (socket, data, callback) => {
        try {
            const { roomName, roomPicture } = await data;
            const room = new Room({ name: roomName, owner: socket.user._id });
            await room.generateID();
            await room.members.push(socket.user._id);
            if(roomPicture.data) {
                const { success } = validateImageFile(roomPicture);
                if(success) room.roomPicture = await uploadImage(roomPicture, 'roomPicture');
            }
            await User.findByIdAndUpdate(socket.user._id, {$push: {"rooms": room._id}});
            await room.save();
            callback({ success: true, message: `گروه ${roomName} ساخته شد` });         
        } catch (error) {
            callback({ success: false, message: 'خطای سرور!!!' });
        }
    },
    editRoom: async (io, socket, data, callback) => {
        try {
            const { id, roomName, roomPicture } = await data;
            const room = await Room.findOne({ id }).populate('owner');
            if(room.owner._id.toString() === socket.user._id.toString()) {
                if(roomName.trim() !== '') room.name = await roomName.trim();
                if(roomPicture.data) {
                    const { success, message } = validateImageFile(roomPicture);
                    if(!success) return callback({ success: false, message });
                    else {
                        const fileName = await uploadImage(roomPicture, 'roomPicture');
                        if(room.roomPicture) await deleteImage(room.roomPicture, 'roomPicture');
                        room.roomPicture = fileName;
                    }
                }
                await room.save();
                const roomData = { id: room.id, name: room.name };
                if(room.roomPicture) roomData.roomPicture = room.roomPicture;
                io.in(id).emit('change room data', { room: roomData });
                callback({ success: true, message: 'تغییرات با موفقیت انجام شد' });
            } else callback({ success: false, message: 'شما اجازه‌ی ایجاد تغییر در این گروه را ندارید' });
        } catch (error) {
            callback({ success: false, message: 'خطای سرور!!!' });
        }
    },
    leaveRoom: async (socket, data, callback) => {
        try {
            const { id } = await data;
            const room = await Room.findOne({ id }).populate('owner');
            if(!room) callback({ success: false, message: 'گروه یافت نشد' });
            else if(room.owner._id.toString() === socket.user._id.toString()) 
                callback({ success: false, message: 'شما سازنده‌ی این گروه هستید و اجازه‌ی ترک آن را ندارید' });
            else {
                const user = await User.findById(socket.user._id);
                const roomIndex = await user.rooms.indexOf(room._id);
                const userIndex = await room.members.indexOf(user._id);
                if(roomIndex !== -1) user.rooms.splice(roomIndex, 1);
                if(userIndex !== -1) room.members.splice(userIndex, 1);
                await user.save();
                await room.save();
                callback({ success: true, message: 'شما از گروه خارج شدید' });
            }
        } catch (error) {
            callback({ success: false, message: 'خطای سرور!!!' });
        }
    },
    deleteRoom: async (socket, data, callback) => {
        try {
            const { id } = await data;
            const room = await Room.findOne({ id }).populate('owner').populate('messages');
            if(!room) callback({ success: false, message: 'گروه یافت نشد' });
            else if(room.owner._id.toString() !== socket.user._id.toString()) 
                callback({ success: false, message: 'شما اجازه‌ی حذف این گروه را ندارید' });
            else {
                const user = await User.findById(socket.user._id);
                const roomIndex = await user.rooms.indexOf(room._id);
                if(roomIndex !== -1) user.rooms.splice(roomIndex, 1);
                if(room.roomPicture) await deleteImage(room.roomPicture, 'roomPicture');
                await user.save();
                await room.messages.map(message => message.remove());
                await room.remove();
                callback({ success: true, message: 'گروه موردنظر پاک شد' });
            }
        } catch (error) {
            callback({ success: false, message: 'خطای سرور!!!' });
        }
    },
    getRooms: async (socket, data, callback) => {
        try {
            const { search } = await data;
            const rooms = [];
            const roomData = {};
            if(search) {
                // search in rooms by short id
                const room = await Room.findOne({ id: search }).populate('owner');
                if(room) {
                    roomData.id = room.id;
                    roomData.name = room.name;
                    roomData.isOwner = (room.owner._id.toString()===socket.user._id.toString())
                    if(room.roomPicture) roomData.roomPicture = room.roomPicture;
                    callback({ success: true, rooms: [roomData] });
                }
                else {
                    // search in rooms by name
                    const findedRooms = await Room.find({ name: new RegExp(search, 'i') }).populate('owner');
                    for(let i=0; i<findedRooms.length; i++) {
                        roomData.id = findedRooms[i].id;
                        roomData.name = findedRooms[i].name;
                        roomData.isOwner = (findedRooms[i].owner._id.toString()===socket.user._id.toString());
                        if(findedRooms[i].roomPicture) roomData.roomPicture = findedRooms[i].roomPicture;
                        rooms.push(roomData);
                    }    
                    callback({ success: true, rooms });
                }
            } else {
                // find all user rooms
                const user = await User.findById(socket.user._id).populate('rooms');
                for(let i=0; i<user.rooms.length; i++) {
                    const room = await user.rooms[i].populate('owner');
                    const roomData = {
                        id: room.id,
                        name: room.name,
                        isOwner: (room.owner._id.toString()===socket.user._id.toString())
                    }
                    if(room.roomPicture) roomData.roomPicture = await room.roomPicture;
                    rooms.push(roomData);
                    socket.join(room.id);
                }
                callback({ success: true, rooms });
            }
        } catch (error) {
            callback({ success: false, error: 'خطای سرور!!!' });
        }
    },
    getRoom: async (socket, data, callback) => {
        try {
            const { id } = await data;
            const room = await Room.findOne({ id }).populate('owner');
            if(room) {
                const roomInfo = { id: room.id, name: room.name, isOwner: (room.owner._id.toString()===socket.user._id.toString()), isJoined: room.members.includes(socket.user._id) };
                if(room.roomPicture) roomInfo.roomPicture = room.roomPicture;
                callback({ success: true, room: roomInfo });
            } callback({ success: false, error: 'گروه یافت نشد' });
        } catch (error) {
            callback({ success: false, error: 'خطای سرور!!!' });
        }
    },
    getRoomMembers: async (socket, data, callback) => {
        try {
            const { id } = await data;
            const room = await Room.findOne({ id }).populate('owner').populate('members');
            if(room) {
                const members = [];
                for(let i=0; i<room.members.length; i++) {
                    const userData = {
                        name: room.members[i].name,
                        username: room.members[i].username,
                        isOnline: room.members[i].isOnline,
                        lastSeen: room.members[i].lastSeen,
                        isOwner: room.members[i]._id.toString()===room.owner._id.toString()
                    }
                    if(room.members[i].profilePicture) userData.profilePicture = await room.members[i].profilePicture;
                    members.push(userData);
                } 
                callback({ success: true, members });
            } callback({ success: false, error: 'گروه یافت نشد' });
        } catch(error) {
            callback({ success: false, error: 'خطای سرور!!!' });
        }
    },
    joinRoom: async(socket, data, callback) => {
        try {
            const { id } = await data;
            const room = await Room.findOne({ id });
            if(!room) callback({ success: false, message: 'گروه یافت نشد' });
            else if(room.members.includes(socket.user._id)) callback({ success: false, message: 'شما عضو این گروه هستید' });
            else {
                await room.members.push(socket.user._id);
                await User.findByIdAndUpdate(socket.user._id, {$push: {"rooms": room._id}});
                await room.save();
                callback({ success: true, message: 'شما عضو این گروه شدید' });
            }
        } catch (error) {
            callback({ success: false, message: 'خطای سرور!!!' });
        }
    }
};