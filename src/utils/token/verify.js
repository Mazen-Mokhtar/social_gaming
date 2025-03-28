import jwt from "jsonwebtoken";
export const verifyToken = ({ token, signature = process.env.SIGNATURE }) => {
    try {
        return jwt.verify(token, signature)
    } catch (error) {
        return {error}
    }

}