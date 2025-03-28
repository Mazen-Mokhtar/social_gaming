import EventEmitter from "events";
import { sendEmail } from "../email/sendEmail.js";
import { resetCodeHtml } from "../email/template/resetCode.js";
import crypto from "node:crypto"
export const eventForget = new EventEmitter();
eventForget.on("forget", async ({ email, user }) => {
    try {
        user.resetCode = crypto.randomBytes(6).toString("hex")
        user.resetCodeExpire = Date.now() + 2 * 60 * 1000
        if (user.attempts == 5 || !(user.attempts)) {
            user.attempts = 0;
        }
        user.attemptExpire = Date.now() + 5 * 60 * 1000;
        user.attempts++;
        await user.save();
        const html = resetCodeHtml({ name: user.userName, code: user.resetCode })
        sendEmail({ to: email, html })
    } catch (error) {
        console.log(error.message)
    }

})