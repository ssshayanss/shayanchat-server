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
        return true;
    } catch (error) {
        return false;
    }
};

exports.getCurrentDate = () => {
    const date = new Date().toLocaleDateString('fa-IR').replace(/([۰-۹])/g, token => String.fromCharCode(token.charCodeAt(0) - 1728));;
    const time = new Date();
    return `${date}-${time.getHours()}:${time.getMinutes()}`;
};

exports.groupday = async messages => {
    let byday = {};
    messages.map(message => {
        let d = message['date'].split('-')[0];
        if(!byday[d]) byday[d] = [];
        byday[d].push(message);
    });
    return byday;
};