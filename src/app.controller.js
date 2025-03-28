import { conctionDB } from "./DB/db.connction.js"
import authController from "./modules/auth/auth.controller.js"
import friendController from "./modules/friend/friend.controller.js"
import messageController from "./modules/message/message.controller.js"
import notificaionController from "./modules/notifcation/notification.controller.js"
import postController from "./modules/post/post.controller.js"
import userController from "./modules/user/user.controller.js"
import { globalError, urlError } from "./utils/index.js"
import cors from "cors"

export const bootstrap = (app, express) => {
    conctionDB()
    app.use(cors("*"))
    app.use(express.json())
    app.use("/user", authController)
    app.use("/users", userController)
    app.use("/friend", friendController)
    app.use("/post", postController)
    app.use("/message", messageController)
    app.use("/notification", notificaionController)
    app.all("*", urlError);
    app.use(globalError)
}