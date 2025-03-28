import joi from "joi";
import { information, isValid } from "../../middleware/validation.js";


export const sendMessages = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required(),
    content: joi.string().when("file", {
        is: joi.exist(),
        then: joi.required(),
        otherwise: joi.optional()
    }),
    file: joi.array().items(information.attachment)
})
export const conversations = joi.object().keys({
    authorization: joi.string().required()
})
export const deleteMessage = joi.object().keys({
    id: joi.custom(isValid).required(),
    authorization: joi.string().required()
})
export const softDeleteMessage = joi.object().keys({
    id: joi.custom(isValid).required(),
    authorization: joi.string().required()
})
export const getChat = joi.object().keys({
    id: joi.custom(isValid).required(),
    authorization: joi.string().required()
})