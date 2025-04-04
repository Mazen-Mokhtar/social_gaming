import joi from "joi";
import { isValid } from "../../middleware/validation.js";

export const getProfile = joi.object().keys({
    authorization: joi.string().required()
}).required()
export const getBlocks = joi.object().keys({
    authorization: joi.string().required(),
    page: joi.number(),
    limit: joi.number(),
}).required()
export const getAllUser = joi.object().keys({
    authorization: joi.string().required()
}).required()
export const updateProfile = joi.object().keys({
    authorization: joi.string().required(),
    userName: joi.string()
        .min(2)
        .max(20)
        .pattern(/^(?! )[A-Za-z0-9]+(?: [A-Za-z0-9]+)*(?<! )$/)
        .optional()
        .allow(''),
    password: joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)).optional().allow(''),
    confirmPassword: joi.string().valid(joi.ref("password")).when("password", {
        is: joi.exist(),
        then: joi.required(),
        otherwise: joi.optional().allow('')
    }),
    phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)).optional().allow(''),
    gender: joi.string().valid("male", "female").optional().allow(''),
    DOB: joi.date().less("now").optional().allow('')
}).required();
export const updateImage = joi.object().keys({
    authorization: joi.string().required(),
    file: joi.object().required()
})
export const updateCoverImage = joi.object().keys({
    authorization: joi.string().required(),
    file: joi.object().required()
})
export const getUserProfile = joi.object().keys({
    authorization: joi.string().required(),
    id: joi.custom(isValid).required()
}).required()
export const search = joi.object().keys({
    authorization: joi.string().required(),
    search: joi.string().required()
}).required()