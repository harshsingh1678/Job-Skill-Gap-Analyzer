const multer = require('multer')


const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 3 * 1024 * 1024 // 3 MB (maximum size allowed)
    },

    fileFilter: (req, file, cb) => {
        const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        cb(null, allowed.includes(file.mimetype))
    }
})


module.exports = upload