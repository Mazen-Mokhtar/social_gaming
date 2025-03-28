import joi from "joi";
import { isValid } from "../../middleware/validation.js";

export const getProfile = joi.object().keys({
    authorization: joi.string().required()
}).required()
export const getAllUser = joi.object().keys({
    authorization: joi.string().required()
}).required()
export const updateProfile = joi.object().keys({
    authorization: joi.string().required(),
    userName: joi.string().min(2).max(20).alphanum(),
    password: joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)),
    confirmPassword: joi.string().valid(joi.ref("password")).when("password",
        {
            is: joi.exist(),
            then: joi.required(),
            otherwise: joi.optional()
        }),
    phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)),
    gender: joi.string().valid("male", "female"),
    DOB: joi.date().less("now")
}).required()
export const updateImage = joi.object().keys({
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