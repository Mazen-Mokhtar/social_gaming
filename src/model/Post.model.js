import { model, Schema } from "mongoose";

const postSchema = new Schema(
    {
        userId:
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content:
        {
            type: String,
            required: true
        },
        attachment:
        {
            type: [{ secure_url: String, public_id: String, likes: [{ type: Schema.Types.ObjectId, ref: "User" }] }]
        },
        likes:
        {
            type: [{ type: Schema.Types.ObjectId, ref: "User" }]
        },
        privacy:
        {
            type: String,
            enum: ["public", "private", "onlyFriends", "specific"]
        },
        specific: {
            type: [{ type: Schema.Types.ObjectId, ref: "User" }]
        },
        isDeleted:
        {
            type: Boolean, default: false
        }
    }, { timestamps: true })
postSchema.virtual("comments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "postId"
})
postSchema.virtual("commentCount").get(function () {
    return this.comments ? this.comments.length : 0;
});
postSchema.virtual("likeCount").get(function () {
    return this.likes.length;
})
const Post = model("Post", postSchema);
export default Post;