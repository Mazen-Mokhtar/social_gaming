import jwt from "jsonwebtoken";
export const generatToken = ({ payload, signature = process.env.SIGNATURE, options = {} }) => {
    try {
        return jwt.sign(payload, signature, options)
    } catch (error) {
        return error
    }
}