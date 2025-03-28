import User from "../../../model/User.model.js"
import { connections } from "../soket.controller.js"


export const logout = (socket) => {
    try {
        return socket.on("disconnect", async () => {
            const index = connections.indexOf(socket.id)
            if (index != -1) {
                connections.splice(index, 1)
                await User.updateOne({ _id: socket.id }, { isOnline: false });
                socket.to(socket.userData.friends.map(String)).emit("userStatus", { userId: socket.id, status: "offline" })
                console.log(connections)
            }

        })
    } catch (error) {
        return socket.emit('socket_Error')
    }
}