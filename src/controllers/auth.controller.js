const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path');

const User = require('../models/user.model');
const { validateImageFile, uploadImage, deleteImage, getLocaleDateString } = require('../functions');

const transporter = nodemailer.createTransport({
    service: process.env.TRANSPORTER_SERVICE,
    auth: {
        user: process.env.TRANSPORTER_USER,
        pass: process.env.TRANSPORTER_PASS
    }
});

module.exports = { 
    signup: async (req, res) => {
        try {
            const { name, email, username, password } = await req.body;
            const user = new User({name, email, username, password});
            if(req.file) user.profilePicture = await req.file;
            await user.save();
            return res.status(200).json({ success: true, message: 'اطلاعات شما با موفقیت ثبت شد' });
        } catch (error) {
            return error.code === 11000 
                ? error.keyValue.email
                    ? res.status(400).json({ success: false, message: 'کاربری با این ایمیل وجود دارد' })
                    : res.status(400).json({ success: false, message: 'این نام کاربری استفاده شده است' }) 
                : res.status(500).json({ success: false, message: 'خطای سرور!!!' });
        }
    },
    signin: async (req, res) => {
        try {
            const { username, password } = await req.body;
            const user = await User.findOne({ username });
            if(user) {
                const isMatch = await user.comparePassword(password);
                if(isMatch) {
                    const token = await user.generateToken();
                    return res.status(200).json({ success: true, token, message: 'خوش آمدید' });
                } else return res.status(400).json({ success: false, message: 'نام‌کاربری یا رمزعبور نامعتبر است' }); 
            } else return res.status(400).json({ success: false, message: 'نام‌کاربری یا رمزعبور نامعتبر است' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'خطای سرور!!!' });
        }
    },
    verifyUser: (req, res) => {
        const user = req.user;
        const data = {
            name: user.name,
            email: user.email,
            username: user.username
        };
        if(user.profilePicture) data.profilePicture = user.profilePicture;
        return res.status(200).json({ success: true, user: data });
    },
    sendResetPasswordEmail: async (req, res) => {
        try {
            const { email } = await req.body;
            const user = await User.findOne({ email });
            if(user) {
                const token = jwt.sign({ _id: user._id }, process.env.JWT_PRIVATE_KEY, { expiresIn: '15m' });
                const emailOptions = {
                    from: 'no-reply@shayanchat.com', to: user.email, subject: 'بازیابی رمزعبور',
                    html: 
                    `
                        <p>برای بازیابی رمزعبور روی لینک زیر کلیک کنید</p>
                        <a href='${process.env.ENDPOINT}/reset-password/${token}'>بازیابی رمزعبور</a>
                    `
                };
                await transporter.sendMail(emailOptions);
                return res.status(200).json({ success: true, message: 'لینک بازیابی رمزعبور برای شما ارسال گردید' });
            } else return res.status(200).json({ success: true, message: 'لینک بازیابی رمزعبور برای شما ارسال گردید' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'خطای سرور!!!' });
        }
    },
    getResetPasswordPage: async (req, res) => {
        try {
            const { token } = await req.params;
            const { _id } = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
            const user = await User.findById(_id);
            return user ? res.status(200).sendFile(path.join(__dirname, '../../public/forget-password.html')) : res.status(403).send('خطای دسترسی'); 
        } catch (error) {
            if(error instanceof jwt.JsonWebTokenError) return res.status(403).send('خطای دسترسی'); 
            else return res.status(500).send('خطای سرور'); 
        }
    },
    resetPassword: async (req, res) => {
        try {
            const { token } = await req.params;
            const { password } = await req.body;
            const { _id } = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
            const user = await User.findById(_id);
            if(user) {
                const isMatch = await user.comparePassword(password);
                if(isMatch) return res.status(400).json({ success: false, message: 'رمزعبور انتخاب شده مشابه رمزعبور فعلی شماست', type: 'badRequest' });
                else {
                    user.password = password;
                    await user.save();
                    return res.status(200).json({ success: true, message: 'رمزعبور با موفقیت تغییر یافت' }); 
                }
            } else return res.status(403).json({ success: false, message: 'خطای دسترسی!!!', type: 'accessDenied' });
        } catch (error) {
            if(error instanceof jwt.JsonWebTokenError) 
                return res.status(403).json({ success: false, message: 'زمان اعتبار این صفحه به پایان رسیده است', type: 'accessDenied' });
            else return res.status(500).json({ success: false, message: 'خطای سرور', type: 'serverError' }); 
        }
    },
    editUser: async (socket, data, callback) => {
        try {
            const { name, email, username } = await data;
            const updatedData = {};
            if(name.trim() !== '') updatedData.name = name.trim();
            if(email.trim() !== '') updatedData.email = email.trim();
            if(username.trim() !== '') updatedData.username = username.trim();
            await User.findByIdAndUpdate(socket.user._id, updatedData);
            socket.user = await User.findById(socket.user._id);
            const updatedUser = {
                name: socket.user.name,
                email: socket.user.email,
                username: socket.user.username
            }; 
            callback({ success: true, message: 'تغییرات با موفقیت اعمال شد', user: updatedUser });  
        } catch (error) {
            error.code === 11000 
                ? error.keyValue.email
                    ? callback({ success: false, message: 'کاربری با این ایمیل وجود دارد' })
                    : callback({ success: false, message: 'این نام کاربری استفاده شده است' }) 
                : callback({ success: false, message: 'خطای سرور!!!' });
        }
    },
    changePassword: async (socket, data, callback) => {
        try {
            const { oldPassword, newPassword } = await data;
            const user = await User.findById(socket.user._id);
            if(user) {
                const isMatch = await user.comparePassword(oldPassword);
                if(isMatch) {
                    user.password = await newPassword;
                    user.save();
                    callback({ success: true, message: 'رمزعبور تغییر کرد' });
                } else callback({ success: false, message: 'رمزعبور نامعتبر است' });
            } else callback({ success: false, message: 'کاربر یافت نشد' });
        } catch (error) {
            callback({ success: false, message: 'خطای سرور!!!' });
        }
    },
    changeProfilePicture: async (socket, data, callback) => {
        try {
            const { profilePicture } = await data;
            const { success, message } = validateImageFile(profilePicture);
            if(!success) callback({ success: false, message });
            else {
                const user = await User.findOne(socket.user._id);
                if(user) {
                    const { success, message } = validateImageFile(profilePicture);
                    if(success) {
                        const fileName = await uploadImage(profilePicture, 'profilePicture');
                        if(user.profilePicture) await deleteImage(user.profilePicture, 'profilePicture');
                        user.profilePicture = fileName;
                        await user.save();                
                        callback({ success: true, message: 'تصویر پروفایل تغییر یافت' });
                    } else callback({ success: false, message }); 
                } else callback({ success: false, message: 'کاربر یافت نشد' });
            }
        } catch (error) {
            callback({ success: false, message: 'خطای سرور!!!' });
        }
    },
    logout: async socket => {
        try {
            const lastSeen = getLocaleDateString();
            await User.findByIdAndUpdate(socket.user._id, { isOnline: false, lastSeen });                   
        } catch (error) {}
    },
    deleteAcount: async (socket, callback) => {
        try {
            const user = await User.findById(socket.user._id).populate('rooms');
            for(let i=0; i<user.rooms.length; i++) {
                if(user.rooms[i].owner.toString() === socket.user._id.toString()) {
                    if(user.rooms[i].roomPicture) await deleteImage(user.rooms[i].roomPicture, 'roomPicture');
                    await user.rooms[i].remove();
                }
            }
            if(user.profilePicture) await deleteImage(user.profilePicture, 'profilePicture');
            await user.remove();
            callback({ success: true, message: 'حساب کاربری شما پاک شد' });
        } catch (error) {
            callback({ success: false, message: 'خطای سرور!!!' });
        }
    }
};