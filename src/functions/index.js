const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const maxImageSize = 1048576; 

exports.validateImageFile = file => {
    if(!(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png'))
        return { success: false, message: 'فایل ارسالی باید از نوع jpeg یا jpg یا png باشد.' };
    else if(file.size > maxImageSize) 
        return { success: false, message: `حجم عکس موردنظر باید کمتر از ${Math.floor(maxImageSize/1000000)}MB باشد` };
    else return { success: true };
};

exports.uploadImage = async (file, fileCategory) => {
    try {
        const dirPath = path.join(__dirname, `../../public/${fileCategory}s`);
        const fileName = `${nanoid()}-${file.name}`;
        const isExists = fs.existsSync(dirPath);
        if(!isExists) fs.mkdirSync(dirPath); 
        fs.writeFileSync(path.join(dirPath, fileName), file.data);
        return fileName;
    } catch (error) {
        return false;
    }
};

exports.deleteImage = async (fileName, fileCategory) => {
    try {
        const filePath = `${__dirname}/../../public/${fileCategory}s/${fileName}`;
        const isExists = fs.existsSync(filePath);
        if(isExists) fs.unlinkSync(filePath);
        return { success: true };
    } catch (error) {
        return { success: false };
    }
};

exports.getLocaleDateString = () => {
    // .replace(/([۰-۹])/g, token => String.fromCharCode(token.charCodeAt(0) - 1728))
    const date = new Date().toLocaleDateString('fa-IR');
    const time = new Date().toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran' }).split(':');
    return `${date}-${time[0]}:${time[1]}`;
};

exports.groupByDay = async messages => {
    let daysArray = {};
    messages.map(message => {
        let date = message['date'].split('-')[0];
        if(!daysArray[date]) daysArray[date] = [];
        daysArray[date].push(message);
    });
    return daysArray;
};

exports.slugify = str => {
    const isExists = str.includes('-');
    if(isExists) return { success: false, message: 'اجازه‌ی استفاده از کاراکتر (-) را ندارید' };
    else {
        const words = str.trim().split(/\s+/);
        let slugName = '';
        words.map((word, index) => { slugName += index===0 ? word : `-${word}`; });
        return { success: true, slugName };
    }
};