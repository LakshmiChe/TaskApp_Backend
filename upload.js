const multer = require('multer');
const fs = require('fs');

const path = './uploads';
if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

module.exports = upload;
