const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const { validateImageFile } = require('../functions');

module.exports = (req, res, next) => {
    try {
        const fileCategory = Object.keys(req.files)[0];
        const file = req.files[fileCategory];
        const dirPath = path.join(__dirname, `../../public/${fileCategory}s`);
        const fileName = `${nanoid()}-${file.name}`;
        const { success, message } = validateImageFile(file);
        if(!success) return res.status(400).json({ success: false, message });
        else {
            const isExists = fs.existsSync(dirPath);
            if(!isExists) fs.mkdirSync(dirPath);
            fs.writeFileSync(path.join(dirPath, fileName), file.data);
            req.file = fileName;
            next();
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'خطای سرور!!!' });
    }
};