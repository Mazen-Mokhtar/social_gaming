import nodemailer from "nodemailer";
export const sendEmail = ({ to = "", subject = "Welcome to Facebook App", text = "", html = "" }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            }
        });
        async function main() {
            const info = await transporter.sendMail({
                from: `"Facebook" <${process.env.EMAIL}>`,
                to,
                subject,
                text,
                html,
            });
            console.log("Message sent: %s", info.messageId);
            // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
        }

        main().catch(console.error);
    } catch (error) {
        return { error }
    }
}
