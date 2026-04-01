const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;

    const extention = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extention) {
        return cb(null, true);
    } else {
        cb(new Error('Only these files(jpeg, jpg, png, gif, webp,pdf) are allowed!'), false);
    }
}