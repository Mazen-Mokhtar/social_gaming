import joi from "joi";
import { isValid } from "../../middleware/validation.js";
export const signup = joi.object().keys({
    userName: joi.string().min(2).max(20).alphanum().required(),
    email: joi.string().email({ minDomainSegments: 2, maxDomainSegments: 3, tlds: { allow: ["com", "edu", "net"] } }).required(),
    password: joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)).required(),
    confirmPassword: joi.string().valid(joi.ref("password")).required(),
    phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)).required(),
    gender: joi.string().valid("male", "female").required(),
    DOB: joi.date().less("now").required()
}).required()
export const reSendSignupCode = joi.object().keys({
    authorization: joi.string().required()
}).required()
export const confirmEmail = joi.object().keys({
    authorization: joi.string().required()
}).required()
export const login = joi.object().keys({
    email: joi.string().email({ minDomainSegments: 2, maxDomainSegments: 3, tlds: { allow: ["com", "edu", "net"] } }).required(),
    password: joi.string().required()
}).required()
export const googleLogin = joi.object().keys({
    idToken: joi.string().required()
})
export const forgetPassword = joi.object().keys({
    email: joi.string().email({ minDomainSegments: 2, maxDomainSegments: 3, tlds: { allow: ["com", "edu", "net"] } }).required()
}).required()
export const changePassword = joi.object().keys({
    authorization: joi.string().required(),
    password: joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)).required(),
    cPassword: joi.string().valid(joi.ref("password")).required(),
}).required()
export const resetCode = joi.object().keys({
    authorization: joi.string().required(),
    code: joi.string().required()
}).required()
export const freezeAccount = joi.object().keys({
    authorization: joi.string().required()
}).required()
export const refreshToken = joi.object().keys({
    authorization: joi.string().required(),
    refreshToken: joi.string().required()
})