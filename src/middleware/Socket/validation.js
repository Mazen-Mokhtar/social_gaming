


export const validation = (socket, data, schema) => {
    try {
        let result = schema.validate(data, { abortEarly: false })
        console.log(result)
        if (result.error) {
            result = result.error.details.map((obj) => {
                return obj.message
            })
            socket.emit('socket_Error', result)
            
            return false
        }
        return true
    } catch (error) {
        return socket.emit('socket_Error')
    }

}
