import multer from "multer";

export const fileValid = {
    image: ["image/jpeg", "image/png", "image/gif"],
    document: ["application/pdf", "application/msword"]
}
export const uploadFile = (fileValid = []) => {
    const storage = multer.diskStorage({})

    function fileFilter(req, file, cb) {
        if (fileValid.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error("invlid"), false)
        }

    }
    return multer({ fileFilter, storage })
}
