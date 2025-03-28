import { model, Schema } from "mongoose";

const friendSchema = new Schema(
    {
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
        confirmReq:
        {
            type: Boolean,
            default: false
        },
        delete:
        {
            type: Boolean,
            default: false
        },
        pending: {
            type: Boolean,
            default: false
        },
        isRead: {
            type: Boolean,
            default: false
        }
    })
const Friend = model("Friend", friendSchema);
export default Friend;