import joi from "joi"
import mongoose, { Types } from "mongoose"

export const validation = (schema) => {
    return (req, res, next) => {
        try {
            const allData = { ...req.body, ...req.params, ...req.query }
            if (req.file || req.files) { allData.file = req.file || req.files }
            if (req.headers.authorization) {
                allData.authorization = req.headers.authorization
            }
            if (req.body.specific) {
                req.body.specific = req.body.specific.split(",").map((id) => {
                    id.trim()
                    return new mongoose.Types.ObjectId(id)
                })
                allData.specific = req.body.specific;
            }
            let result = schema.validate(allData, { abortEarly: false })
            if (result.error) {
                result = result.error.details.map((obj) => {
                    return obj.message
                })
                return next(new Error(result, { cause: 400 }));
            }
            return next()
        } catch (error) {
            return next(error)
        }
    }

}
export const isValid = (value, helpers) => {
    if (!Types.ObjectId.isValid(value)) return helpers.message("invalid id")
    return value
}

export const information = {
    attachment: joi.object({
        fieldname: joi.string().required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        mimetype: joi.string().required(),
        destination: joi.string().required(),
        filename: joi.string().required(),
        path: joi.string().required(),
        size: joi.number().required()
    }),

}