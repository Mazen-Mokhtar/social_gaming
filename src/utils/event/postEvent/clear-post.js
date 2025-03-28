import { EventEmitter } from "node:events";
import { cloud } from "../../multer/cloudinary.js";
export const postEvent = new EventEmitter();
postEvent.on("clear", async (user) => {
   await Promise.all(user.attachment.map(async (obj) => {
        await cloud().uploader.destroy(obj.public_id)
    }))
    return 1;
})