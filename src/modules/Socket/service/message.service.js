
import { validation } from "../../../middleware/Socket/validation.js";
import Friend from "../../../model/friend.model.js";
import Message from "../../../model/Message.model.js";
import User from "../../../model/User.model.js";
import { messageSystem } from "../../../utils/index.js";
import { cloud, folderNames } from "../../../utils/multer/cloudinary.js";
import { sendMessages } from "../validtions/message.validation.js";







export const sendMessage = (socket, io) => {
    return socket.on("sendMessage", async (data) => {
        try {
            // console.log(data)
            const cheak = validation(socket, data, sendMessages)
            // console.log(cheak)
            if (!cheak) return false;
            let { destId, images } = data;
            if (socket.id === destId)
                return socket.emit('socket_Error', { error: messageSystem.message.cSendYourSelf })
            let status = "friends";
            const cheakFriends = await Friend.findOne({
                $or: [
                    { senderId: socket.id, resverId: destId, confirmReq: true },
                    { senderId: destId, resverId: socket.id, confirmReq: true }
                ]
            })
            if (!cheakFriends)
                status = "requests"
            let attachment = []
            if (images && images.length > 0) {
                attachment = await Promise.all(
                    images.map(async (image) => {
                        const { secure_url, public_id } = await cloud().uploader.upload(image, {
                            resource_type: 'image',
                            folder: `social-app/users/${socket.id}/photo-Message/${destId}`
                        });
                        return { secure_url, public_id };
                    })
                );
            }
            // console.log({ data })
            const userMessage = new Message(
                {
                    content: data.content,
                    attachment,
                    status,
                    senderId: socket.id,
                    resverId: destId
                });
            await userMessage.save()
            console.log(userMessage)
            await userMessage.populate([{ path: "senderId", select: "_id profileImage verification" }, { path: "resverId", select: "_id profileImage verification" }])
            // console.log(userMessage)
            socket.emit("successMessage", { message: userMessage })
            const cheakOnline = io.sockets.sockets.get(destId)

            socket.to(destId).emit("receiveMessage", { message: userMessage });


        } catch (error) {
            console.log(error)
            socket.emit('socket_Error', { error: 'Failed to send message' });
        }
    })
}


export const takeMessage = (socket) => {
    try {
        return socket.on("messageRead", async (data) => {
            const message = await Message.findByIdAndUpdate(data.messageId,
                { read: true },
                { new: true }).select("read senderId")
            if (!message) {
                return socket.emit('socket_Error', { error: messageSystem.message.notFound })
            }
            console.log({ message })
            socket.to(message.senderId.toString()).emit("messageUpdated", { messageId: data.messageId, read: true })
        })
    } catch (error) {
        console.log(error)
        return socket.emit('socket_Error')
    }
}


export const updatedMessages = (socket) => {
    try {
        return socket.on("updateMessages", (data) => {
            const { message } = data
            socket.to(message.senderId._id.toString()).emit("messageUpdated", { messageId: message._id.toString(), read: true })
        })
    } catch (error) {
        return socket.emit('socket_Error')
    }
}


export const typing = (socket) => {
    try {
        return socket.on("typing", async (data) => {
            console.log('Received typing from:', socket.id, 'to:', data.destId);
            const user = await User.findById(data.destId)
            if (!user)
                return socket.emit('socket_Error')
            socket.to(data.destId).emit("typing", { senderId: socket.id })
        })
    } catch (error) {
        console.log(error)
        return socket.emit('socket_Error')
    }
}
export const stopTyping = (socket) => {
    try {
        return socket.on("stopTyping", async (data) => {
            console.log('Received stopTyping from:', socket.id, 'to:', data.destId)
            const user = await User.findById(data.destId)
            if (!user)
                return socket.emit('socket_Error')
            socket.to(data.destId).emit("stopTyping", { senderId: socket.id })
        })
    } catch (error) {
        console.log(error)
        return socket.emit('socket_Error')
    }
}


export const online = async (socket) => {
    try {
        console.log(`User ${socket.id} is online`);
        const ids = socket.userData.friends.map(String)
        await User.updateOne({ _id: socket.id }, { isOnline: true });
        return socket.to(socket.userData.friends.map(String)).emit("userStatus", { userId: socket.id, status: "online" })
    } catch (error) {
        return socket.emit('socket_Error')
    }

}

export const likeUnLike = async (socket, io) => {

    try {
        return socket.on("likeMessage", async (data) => {
            const { messageId } = data;
            Message.schema.set("toJSON", { virtuals: true })
            const message = await Message.findById(messageId);
            if (!message)
                return socket.emit('socket_Error', messageSystem.message.notFound)
            const index = message.likes?.map(String).indexOf(socket.id)
            if (index == -1) {
                message.likes?.push(socket.id);


            } else {
                message.likes?.splice(index, 1)


            }
            console.log(message.likes?.length)
            await message.save()
            io.to([message.resverId.toString(), message.senderId.toString()]).emit("messageLiked",
                { messageId, likes: message.likes?.length || 0, likedBy: message.likes })

        })
    } catch (error) {
        console.log(error)
        socket.emit('socket_Error', { message: 'Error liking message' });
    }
}