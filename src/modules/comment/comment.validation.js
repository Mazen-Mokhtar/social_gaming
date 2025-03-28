import joi from "joi";
import { information, isValid } from "../../middleware/index.js";

export const addComment = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid),
    postId: joi.custom(isValid).required(),
    content: joi.string(),
    file: information.attachment
}).or("attachment", "content").required()
export const updateComment = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required(),
    postId: joi.custom(isValid).required(),
    content: joi.string(),
    file: information.attachment
}).or("attachment", "content").required()

export const deleteComment = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required(),
    postId: joi.custom(isValid).required()
}).required()

export const getReplies = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required(),
    postId: joi.custom(isValid).required()
}).required()

export const getComment = joi.object().keys({
    authorization: joi.string().required(),
    postId: joi.custom(isValid).required(),
    page: joi.number()
}).required()

export const likeUnLike = joi.object().keys({
    authorization: joi.string().required(),
    postId: joi.custom(isValid).required(),
    id: joi.custom(isValid).required()
})