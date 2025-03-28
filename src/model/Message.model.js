import { model, Schema } from "mongoose";


const messageSchema = new Schema(
    {
        content:
        {
            type: String,
            required: function () { return !this.attachment.secure_url === this.attachment.secure_url },
            trim: true
        },
        attachment:
        {
            type: [{ secure_url: String, public_id: String }]
        },
        senderId:
        {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        resverId:
        {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        read:
        {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ["friends", "requests"]
        },
        likes: [{ type: Schema.Types.ObjectId}],
        isDeletedSenderId:
        {
            type: Boolean,
            default: false
        },
        isDeletedResverId:
        {
            type: Boolean,
            default: false
        }
    }, { timestamps: true })
const Message = model("Message", messageSchema)
export default Message