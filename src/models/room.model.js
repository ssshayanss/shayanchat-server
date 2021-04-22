const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const RoomSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    slugName: {
        type: String, 
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    roomPicture: { type: String },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        }
    ]
}, { timestamps: true });

RoomSchema.methods.generateID = function() {
    this.id = nanoid();
};

module.exports = mongoose.model('Room', RoomSchema);