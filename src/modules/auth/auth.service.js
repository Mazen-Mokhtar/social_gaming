import User from "../../model/User.model.js"
import { generatToken, messageSystem, verifyToken } from "../../utils/index.js";
import { eventSend } from "../../utils/event/send-email.js";
import { eventForget } from "../../utils/event/forget-password.js";
import { OAuth2Client } from "google-auth-library";

export const signup = async (req, res, next) => {
    const { email } = req.body;
    const cheak = await User.findOne({ email })
    if (cheak) return next(new Error(messageSystem.user.alreadyExist, { cause: 409 }));
    const user = await User.create(req.body);
    const token = generatToken({
        payload: { userEmail: user.email },
        signature: process.env.SIGNATURE_SIGNUP,
        options: { expiresIn: "15m" }
    })
    eventSend.emit("sender", { email, user })
    return res.status(201).json({ success: true, message: messageSystem.user.emailActive, data: token });
}
export const reSendSignupCode = async (req, res, next) => {
    const { data } = req;
    if (!data.userEmail) return next(new Error(messageSystem.user.token, { cause: 400 }))
    const user = await User.findOne({ email: data.userEmail })
    if (!user) return next(new Error(messageSystem.user.notFound, { cause: 404 }))
    eventSend.emit("sender", { email: data.userEmail, user })
    return res.status(200).json({ success: true, message: messageSystem.user.emailActive })
}
export const confirmEmail = async (req, res, next) => {
    let { authorization } = req.params;
    authorization = verifyToken({ token: authorization, signature: process.env.SIGNATURE_SIGNUP })
    if (authorization.error) return next(new Error(messageSystem.user.token, { cause: 400 }))
    const user = await User.findByIdAndUpdate(authorization.userId, { confirmEmail: true });
    if (!user) return next(new Error(messageSystem.user.notFound))
    return res.status(200).json({ success: true, message: messageSystem.user.emailIsActived })

}
export const login = async (req, res, next) => { 
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new Error(messageSystem.user.invalid, { cause: 409 }));
    const cheak = await user.comparePassword(password);
    if (!cheak) return next(new Error(messageSystem.user.invalid, { cause: 409 }))
    if (!user.confirmEmail) return next(new Error(messageSystem.user.emailActive, { cause: 400 }))
    if (user.isDeleted) {
        user.isDeleted = false
        await user.save()
    }
    if (user.resetCode || user.attempts) {
        user.resetCode = undefined
        user.resetCodeExpire = undefined
        user.attempts = undefined
        user.attemptExpire = undefined
        await user.save()
    }
    const token = user.role == "user"
        ? generatToken({
            payload: { userId: user._id, role: user.role, islogin: true }
        })
        : generatToken({
            payload: { userId: user._id, role: user.role, islogin: true }
            , signature: process.env.SIGNATURE_ADMIN
            , options: { expiresIn: "15m" }
        })
    const refreshToken = user.role == "user"
        ? generatToken({
            payload: { userId: user._id, role: user.role, islogin: true },
            options: { expiresIn: "7d" }
        })
        : generatToken({
            payload: { userId: user._id, role: user.role, islogin: true }
            , signature: process.env.SIGNATURE_ADMIN
            , options: { expiresIn: "1d" }
        })
    return res.status(200).json({ success: true, message: messageSystem.user.login, token, refreshToken })
}
export const googleLogin = async (req, res, next) => {
    const { idToken } = req.body;
    const client = new OAuth2Client()
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.CLIENT_ID
    }
    )
    if (!ticket)
        return next(new Error(messageSystem.user.invalid, { cause: 409 }))
    const { email, name, picture } = ticket
    let user = await User.findOne({ email })
    if (!user) {
        user = await User.create(
            {
                email,
                userName: name,
                profileImage: { secure_url: picture },
                provider: "google"
            })
    }
    const token = user.role == "admin"
        ? generatToken({
            payload: { userId: user._id, islogin: true }
            , signature: process.env.SIGNATURE_ADMIN
            , options: { expiresIn: "15m" }
        })
        : generatToken({ payload: { userId: user._id, islogin: true } })
    return res.status(200).json({ success: true, message: messageSystem.user.login, data: token })
}
export const forgetPassword = async (req, res, next) => {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) return next(new Error(messageSystem.user.notFound, { cause: 404 }));
    if (user.attempts == 5 && user.attemptExpire > Date.now())
        return next(new Error(messageSystem.errors.code, { cause: 401 }))
    eventForget.emit("forget", { email, user });
    return res.status(200).json({ success: true, message: messageSystem.user.resetCode })
}
export const resetCode = async (req, res, next) => {
    const { data } = req
    const { code } = req.body;
    const user = await User.findOne({ _id: data.userId, resetCode: code });
    if (!user) return next(new Error(messageSystem.user.notFound, { cause: 409 }))
    if (user.resetCodeExpire < Date.now()) {
        user.resetCode = undefined
        user.resetCodeExpire = undefined;
        await user.save()
        return next(new Error(messageSystem.user.expiredCode, { cause: 409 }));
    }
    const token = generatToken({
        payload: { userId: user._id, sendCode: true },
        signature: process.env.SIGNATURE_REST_CODE, options: { expiresIn: "15m" }
    });
    user.resetCode = undefined
    user.resetCodeExpire = undefined;
    await user.save()
    return res.status(200).json({ success: true, data: token })
}
export const changePassword = async (req, res, next) => {
    const { data } = req;
    const { password, cPassword } = req.body;
    const user = await User.findById(data.userId)
    if (!user) return next(new Error(messageSystem.user.notFound, { cause: 404 }))
    if (password !== cPassword) return next(new Error(messageSystem.user.incorrectPassword, { cause: 400 }));
    user.password = password;
    user.isModified("password");
    await user.save();
    return res.status(200).json({ success: true, message: messageSystem.user.updatedSuccessfully })
}
export const freezeAccount = async (req, res, next) => {
    const { data } = req
    const user = await User.findById(data.userId)
    if (!user) return next(new Error(messageSystem.user.notFound, { cause: 404 }));
    if (user.isDeleted) return next(new Error(messageSystem.user.isAlreadyDeleted, { cause: 404 }))
    user.isDeleted = true;
    user.deletedAt = Date.now();
    await user.save();
    return res.status(200).json({ success: true, message: messageSystem.user.freezeAcc })
}
export const refreshToken = async (req, res, next) => {
    const { userData } = req;
    const { refreshToken } = req.body;
    let result;
    if (userData.role == "user") {
        result = verifyToken({ token: refreshToken })
    } else {
        result = verifyToken({ token: refreshToken, signature: process.env.SIGNATURE_ADMIN })
    }
    if (result.error) {
        return next(result.error)
    }
    const token = userData.role == "user"
        ? generatToken({
            payload: { userId: result.userId, role: result.role, islogin: true },
            options: { expiresIn: "1h" }
        })
        : generatToken({
            payload: { userId: result.userId, role: result.role, islogin: true },
            signature: process.env.SIGNATURE_ADMIN,
            options: { expiresIn: "15m" }
        })
    return res.status(200).json({ success: true, token })
}