const multer = require('multer')


const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];


const upload = multer({

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 3 * 1024 * 1024 // 3 MB (maximum size allowed)
    },

    fileFilter: (req, file, cb) => {

        if (ALLOWED_TYPES.includes(file.mimetype)) {
            return cb(null, true);
        }

        return cb(new Error("Invalid file type. Only PDF and DOCX are allowed."));
    }
})


module.exports = upload