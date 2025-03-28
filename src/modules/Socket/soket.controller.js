import { Server } from "socket.io"
import { authorizationV2 } from "../../middleware/Socket/authentication.js"

import { messageSystem } from "../../utils/index.js"
import { logout } from "./service/auth.service.js"
import { likeUnLike, online, sendMessage, stopTyping, takeMessage, typing, updatedMessages } from "./service/message.service.js"








export const connections = []



export const runIo = (httpServer) => {
    const io = new Server(httpServer, { cors: "*" })
    io.use(async (socket, next) => {
        const userData = await authorizationV2(socket.handshake.auth.token, next);
        // console.log(userData)
        if (!userData) {
            return next(new Error(messageSystem.user.notFound))
        }
        socket.id = userData._id.toString()
        if (!connections.includes(socket.id)) {
            connections.push(socket.id)
        }
        console.log(connections)
        socket.userData = userData;
        next()
    })

    io.on("connection", (socket) => {
        logout(socket)
        sendMessage(socket, io)
        takeMessage(socket)
        updatedMessages(socket)
        typing(socket)
        stopTyping(socket)
        online(socket)
        likeUnLike(socket, io)
    })
}