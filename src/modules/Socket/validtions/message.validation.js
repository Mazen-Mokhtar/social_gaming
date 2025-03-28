import joi from "joi";
import { isValid } from "../../../middleware/index.js";





export const sendMessages = joi.object({
    destId: joi.custom(isValid).required(),
    content: joi.string().allow("").optional(),
    images: joi.array().items(joi.string()).when("content", {
        is: "", 
        then: joi.array().items(joi.string()).min(1), 
        otherwise: joi.array().items(joi.string()).optional()
    })
});