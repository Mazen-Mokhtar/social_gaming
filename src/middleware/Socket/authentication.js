import User from "../../model/User.model.js";
import { messageSystem, verifyToken } from "../../utils/index.js";


export const authorization = (req, res, next) => {
    try {
        let { authorization } = req.headers
        if (!authorization) {
            return next(new Error("authorization is required", { cause: 400 }));
        }
        authorization = authorization.split(" ")
        if (authorization[0] === "admin") {
            authorization = verifyToken({ token: authorization[1], signature: process.env.SIGNATURE_ADMIN });
        } else if (authorization[0] === "restCode") {
            authorization = verifyToken({ token: authorization[1], signature: process.env.SIGNATURE_REST_CODE });
        } else if (authorization[0] === "signup") {
            authorization = verifyToken({ token: authorization[1], signature: process.env.SIGNATURE_SIGNUP });
        } else {
            authorization = verifyToken({ token: authorization[1] })
        }
        if (authorization.error) return next(new Error(messageSystem.user.token, { cause: 400 }))
        req.data = authorization;
        return next();
    } catch (error) {
        return next(error);
    }

}
export const authorizationV2 = async (authorization, next) => {
    try {
        if (!authorization) {
            return next("authorization is required");
        }
        authorization = authorization.split(" ")
        if (authorization[0] === "admin") {
            authorization = verifyToken({ token: authorization[1], signature: process.env.SIGNATURE_ADMIN });
        } else if (authorization[0] === "restCode") {
            authorization = verifyToken({ token: authorization[1], signature: process.env.SIGNATURE_REST_CODE });
        } else {
            authorization = verifyToken({ token: authorization[1] })
        }
        // console.log(authorization)
        if (authorization.error) return next(new Error(messageSystem.user.token));
        const userData = await User.findById(authorization.userId).select("-password -confirmEmail -__v -isDeleted");
        // console.log(userData)
        if (!userData) return next(new Error (messageSystem.user.notFound))
        if (userData.isDeleted) return next(new Error(messageSystem.user.freezeAcc))
        const { iat } = authorization
        if (userData.deletedAt && userData.deletedAt.getTime() > iat * 1000) return next(new Error(messageSystem.user.token))
            // console.log(userData)
        return userData;
    } catch (error) {
        return next(error);
    }

}
export const authorizationV3 = async (req, res, next) => {
    try {
        let { authorization } = req.headers
        if (!authorization) {
            return next();
        }
        authorization = authorization.split(" ")
        if (authorization[0] === "admin") {
            authorization = verifyToken({ token: authorization[1], signature: process.env.SIGNATURE_ADMIN });
        } else if (authorization[0] === "restCode") {
            authorization = verifyToken({ token: authorization[1], signature: process.env.SIGNATURE_REST_CODE });
        } else {
            authorization = verifyToken({ token: authorization[1] })
        }
        if (authorization.error) return next(new Error(messageSystem.user.token, { cause: 400 }));
        const userData = await User.findById(authorization.userId).select("-password -confirmEmail -__v -isDeleted");
        if (!userData) return next(new Error(messageSystem.user.notFound, { cause: 404 }))
        if (userData.isDeleted) return next(new Error(messageSystem.user.freezeAcc, { cause: 400 }))
        const { iat } = authorization
        if (userData.deletedAt && userData.deletedAt.getTime() > iat * 1000) return next(new Error(messageSystem.user.token, { cause: 400 }))
        req.userData = userData;
        return next();
    } catch (error) {
        return next(error);
    }

}