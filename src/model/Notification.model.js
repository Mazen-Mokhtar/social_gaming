import { Schema, model } from "mongoose";


const notificationSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["like", "comment", "frinedRequest", "mention"],
            required: true,
        },
        post: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: function () {
                return this.type === "like" || this.type === "comment";
            },
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);


const Notification = model("Notification", notificationSchema);

export default Notification