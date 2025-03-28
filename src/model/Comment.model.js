import { Schema, model } from "mongoose";
import { cloud } from "../utils/multer/cloudinary.js";

const commentSchema = new Schema({
    content:
    {
        type: String,
        required: true
    },
    attachment:
    {
        type: { secure_url: String, public_id: String }
    },
    postId:
    {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    senderId:
    {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    perentComment:
    {
        type: Schema.Types.ObjectId
    },
    isDeleted:
    {
        type: Boolean,
        default: false
    },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true })


commentSchema.post("deleteOne", { query: false, document: true }, async function (doc, next) {
    const replise = await this.constructor.find({ perentComment: doc._id })
    if (replise.length > 0) {
        for (const obj of replise) {
            if (obj.attachment?.public_id)
                await cloud().uploader.destroy(obj.attachment.public_id)
            await obj.deleteOne()
        }

    }
    return next();
})
commentSchema.virtual("likeCount").get(function () {
    return this.likes.length
})

export const Comment = model("Comment", commentSchema);
