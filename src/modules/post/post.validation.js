import joi from "joi";
import { information, isValid } from "../../middleware/validation.js";

export const creatPost = joi.object().keys({
    authorization: joi.string().required(),
    content: joi.string().when("file", {
        is: joi.exist(),
        then: joi.optional(),
        otherwise: joi.required()
    }),
    file: joi.array().items(information.attachment),
    tags: joi.array().items(joi.string()),
    privacy: joi.string().valid("public", "onlyFriends", "private", "specific").required(),
    specific: joi.array().items(joi.custom(isValid))
})
export const userPosts = joi.object().keys({
    authorization: joi.string().required(),
    page: joi.number(),
    limit: joi.number()
})
export const userPostsId = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required(),
    page: joi.number(),
    limit: joi.number()
})
export const postDetails = joi.object().keys({
    authorization: joi.string(),
    postId: joi.custom(isValid).required(),
    page: joi.number()
})
export const updatePost = joi.object().keys({
    authorization: joi.string().required(),
    postId: joi.string().required(),
    content: joi.string().when("file", {
        is: joi.exist(),
        then: joi.optional(),
        otherwise: joi.required()
    }),
    file: joi.array().items(information.attachment)
})
export const deleteMyPost = joi.object().keys({
    authorization: joi.string().required(),
    postId: joi.custom(isValid).required()
})
export const likeUnLike = joi.object().keys({
    authorization: joi.string().required(),
    postId: joi.custom(isValid).required()
})
export const searchPost = joi.object().keys({
    authorization: joi.string().required(),
    search: joi.string().required()
})
export const forYouPosts = joi.object().keys({
    authorization: joi.string().required()
})
export const archive = joi.object().keys({
    authorization: joi.string().required(),
    postId: joi.custom(isValid).required()
})
export const undoArchive = joi.object().keys({
    authorization: joi.string().required(),
    postId: joi.custom(isValid).required()
})
