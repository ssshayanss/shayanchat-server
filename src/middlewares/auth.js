const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.signinRequired = async (req, res, next) => {
    try {
        if(req.headers.authorization) {
            const token = await req.headers.authorization.split(' ')[1];
            const { _id } = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
            const user = await User.findById(_id);
            if(user) {
                req.user = await user;
                next();
            } else return res.status(403).json({ success: false, message: 'خطای دسترسی!!!' }); 
        } else return res.status(403).json({ success: false, message: 'خطای دسترسی!!!' }); 
    } catch (error) {
        if(error instanceof jwt.JsonWebTokenError)
            return res.status(403).json({ success: false, message: 'خطای دسترسی!!!' });         
        else return res.status(500).json({ success: false, message: 'خطای سرور!!!' }); 
    }
};

exports.ioSigninRequired = async (socket, next) => {
    try {
        const token = await socket.handshake.query.token;
        const { _id } = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
        const user = await User.findById(_id);
        if(user) {
            await User.findByIdAndUpdate(_id, { isOnline: true });
            socket.user = await user;
            next();    
        }
    } catch (error) {
        next(new Error('خطای دسترسی!!!'));
    }
};