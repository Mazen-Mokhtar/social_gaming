import joi from "joi";
import { isValid } from "../../middleware/index.js";

export const sendFriendRequest = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required()
}).required()
export const cancelFriendRequest = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required()
}).required()
export const cancelFriend = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required()
}).required()
export const confiremOrDelete = joi.object().keys({
    authorization: joi.string().required(),
    profile_id: joi.custom(isValid).required(),
    status: joi.string().valid("confirmReq", "delete").required()
}).required()
export const getFriends = joi.object().keys({
    authorization: joi.string().required(),
}).required()
export const getRequsetFrinds = joi.object().keys({
    authorization: joi.string().required(),
}).required()
export const searchForFriends = joi.object().keys({
    authorization: joi.string().required(),
    search: joi.string().required()
}).required()
export const suggestionsFriends = joi.object().keys({
    authorization: joi.string().required(),
}).required()
export const mutualFriends = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required()
}).required()
export const blockUser = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required()
}).required()
export const unBlockUser = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required()
}).required()