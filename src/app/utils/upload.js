const fs = require('fs');
const path = require('path');
const os = require('os');
const security = require('../utils/security');
let multer = require('multer');
const config = require('../../config/config');

const storage = multer.diskStorage({
  destination: global.imagesPath,
  filename: (req, file, cb) => {
    let fileName = security.generateImageToken() + path.extname(file.originalname);
    console.info('Uploading file ', fileName, `into ${global.imagesPath}`);
    cb(null, fileName)
  }
});

const upload = multer({storage}).single('image');

module.exports = { 
    upload
};
