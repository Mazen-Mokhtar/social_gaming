import EventEmitter from "events";
import Notification from "../../../model/Notification.model.js";


export const notificationEvent = new EventEmitter()


notificationEvent.on("send", async ({ userId, sender, type, postId = undefined }) => {

    let message = "Send Friend Request";

    switch (type) {
        case "like":
            message = "Like Post";
            break;
        case "comment":
            message = "Comment in your post";
            break;
        case "friendRequest":
            message = "Send Friend Request";
            break;
        case "mention":
            message = "Mention you";
            break;
    }

    const notification = new Notification({
        user: userId,
        sender: sender,
        type,
        post: postId,
        message,
    });

    await notification.save();
})