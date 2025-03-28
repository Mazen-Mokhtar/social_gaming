import { EventEmitter } from "events";
import { sendEmail } from "../email/sendEmail.js";
import { confirmTemplate } from "../email/template/email.js";
import { generatToken } from "../token/generat.js";

export const eventSend = new EventEmitter();

eventSend.on("sender", ({ email, user }) => {
    try {
        const token = generatToken({
            payload: { userId: user._id },
            signature: process.env.SIGNATURE_SIGNUP,
            options: { expiresIn: "15m" }
        })
        const link = `http://localhost:3001/user/confirm-email/${token}`
        const html = confirmTemplate({ link })
        sendEmail({ to: email, html })
    } catch (error) {
        console.log(error)
    }

})
