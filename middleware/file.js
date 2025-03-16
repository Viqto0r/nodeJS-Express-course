const multer = require('multer')
const { v4 } = require('uuid')

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'images')
  },
  filename(req, file, cb) {
    cb(null, v4() + '-' + file.originalname)
  },
})

const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg']

const fileFilter = (req, file, cb) => {
  const isValid = allowedTypes.includes(file.mimetype)

  cb(null, isValid)
}

module.exports = multer({ storage, fileFilter })
