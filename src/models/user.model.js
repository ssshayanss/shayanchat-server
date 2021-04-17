const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hashPassword: {
        type: String,
        required: true
    },
    profilePicture: { type: String },
    lastSeen: { 
        type: String,
        default: ''
    },
    isOnline: { 
        type: Boolean,
        default: false
    },
    rooms: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room'
        }
    ]
}, { timestamps: true });

UserSchema.virtual('password')
.set(function(password) {
    this.hashPassword = bcrypt.hashSync(password, parseInt(process.env.SALT_ROUNDS));
});

UserSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.hashPassword);
};

UserSchema.methods.generateToken = function() {
    return jwt.sign({ _id: this._id }, process.env.JWT_PRIVATE_KEY, { expiresIn: process.env.JWT_EXPIRESIN });
};

module.exports = mongoose.model('User', UserSchema);