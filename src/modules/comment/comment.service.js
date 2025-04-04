import mongoose from "mongoose";
import { Comment } from "../../model/Comment.model.js";
import Post from "../../model/Post.model.js";
import User from "../../model/User.model.js";
import { messageSystem } from "../../utils/index.js";
import { cloud, folderNames } from "../../utils/multer/cloudinary.js";
import { notificationEvent } from "../../utils/event/notification/notificaions.js";


export const addComment = async (req, res, next) => {
    const { postId, id } = req.params
    const { userData } = req;
    const { content } = req.body
    User.schema.set("toJSON", { virtuals: false })
    const cheakPost = await Post.findById(postId);
    if (!cheakPost)
        return next(new Error(messageSystem.post.notFound))
    const cheakComment = await Comment.findOne({ _id: id, isDeleted: false });
    if (id && !cheakComment)
        return next(new Error(messageSystem.comment.notFound, { cause: 404 }))
    let attachment;
    if (req.file) {
        const folder = folderNames({ userData }).comment
        const { secure_url, public_id } = await cloud().uploader.upload(req.file.path, folder);
        attachment = { secure_url, public_id };
    }
    const comment = await Comment.create(
        {
            content,
            attachment,
            postId,
            perentComment: id,
            senderId: userData._id
        })
    await comment.populate({
        path: "senderId",
        select: "userName profileImage verification"
    });
    if (userData._id !== cheakPost.userId)
        notificationEvent.emit("send", { type: "comment", sender: userData._id, postId, userId: cheakPost.userId })
    return res.status(201).json(
        {
            success: true,
            message: messageSystem.comment.createdSuccessfully,
            data: comment
        })
}
export const updateComment = async (req, res, next) => {
    const { id } = req.params
    const { userData } = req;
    const { content } = req.body;
    Comment.schema.set("toJSON", { virtuals: true })
    const comment = await Comment.findOneAndUpdate(
        { _id: id, senderId: userData._id, },
        { content }, { new: true });
    if (!comment)
        return next(new Error(messageSystem.comment.invalid, { cause: 404 }));
    return res.status(200).json({
        success: true, message: messageSystem.comment.updatedSuccessfully,
        data: comment
    })
}
export const deleteComment = async (req, res, next) => {
    const { id } = req.params
    const { userData } = req;
    const comment = await Comment.findById({ _id: id })
        .populate([{ path: "postId", select: "userId" }])

    if (!comment)
        return next(new Error(messageSystem.comment.notFound, { cause: 404 }))
    if (![comment.senderId.toString(), comment.postId.userId.toString()].includes(userData._id.toString()))
        return next(new Error(messageSystem.comment.notAuthorized, { cause: 401 }))
    if (comment.attachment?.public_id)
        await cloud().uploader.destroy(comment.attachment.public_id);
    await comment.deleteOne()
    return res.status(200).json({ success: true, message: messageSystem.comment.deletedSuccessfully })
}
export const getReplies = async (req, res, next) => {
    const { id } = req.params;

    // تعطيل virtuals في الـ User schema
    User.schema.set("toJSON", { virtuals: false });

    // تفعيل virtuals في الـ Comment schema
    Comment.schema.set("toJSON", { virtuals: true });

    try {
        const replies = await Comment.aggregate([
            {
                $match: { perentComment: new mongoose.Types.ObjectId(id) } // جلب الردود الخاصة بالتعليق
            },
            {
                $lookup: {
                    from: "users", // الربط مع مجموعة الـ Users
                    localField: "senderId",
                    foreignField: "_id",
                    as: "senderId"
                }
            },
            {
                $unwind: "$senderId" // لفصل الـ senderId
            },
            {
                $lookup: {
                    from: "comments", // الربط مع الكومنتات تاني للحصول على الردود
                    localField: "_id",
                    foreignField: "perentComment",
                    as: "replies"
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    attachment: 1,
                    postId: 1,
                    senderId: {
                        _id: 1,
                        userName: 1,
                        profileImage: 1,
                        verification: 1
                    },
                    likes: {
                        $map: {
                            input: { $ifNull: ["$likes", []] },
                            as: "like",
                            in: {
                                _id: "$$like._id",
                                userName: "$$like.userName",
                                profileImage: "$$like.profileImage"
                            }
                        }
                    },
                    likeCount: { $size: { $ifNull: ["$likes", []] } },
                    isDeleted: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    replyCount: {
                        $size: {
                            $filter: {
                                input: { $ifNull: ["$replies", []] },
                                as: "reply",
                                cond: { $eq: ["$$reply.isDeleted", false] }
                            }
                        }
                    }
                }
            }
        ]);

        if (replies.length === 0) {
            return next(new Error(messageSystem.comment.notFound));
        }

        return res.status(200).json({ success: true, data: replies });
    } catch (error) {
        return next(error);
    }
};

export const getComment = async (req, res, next) => {
    const { postId } = req.params;
    const { page = 1 } = req.query; // Default page to 1 if not provided
    const limit = 6; // Number of comments per page
    const skip = (page - 1) * limit;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
        return next(new Error(messageSystem.post.notFound, { cause: 404 }));
    }

    // Aggregation pipeline to fetch comments and their reply counts
    const comments = await Comment.aggregate([
        // Match top-level comments (no perentComment) for the given postId, not deleted
        {
            $match: {
                perentComment: { $exists: false },
                postId: new mongoose.Types.ObjectId(postId), // Ensure postId is ObjectId
                isDeleted: false
            }
        },
        // Lookup to populate senderId
        {
            $lookup: {
                from: "users",
                localField: "senderId",
                foreignField: "_id",
                as: "senderId"
            }
        },
        { $unwind: "$senderId" }, // Unwind senderId to match populate behavior
        // Lookup to populate likes
        {
            $lookup: {
                from: "users",
                localField: "likes",
                foreignField: "_id",
                as: "likes"
            }
        },
        // Lookup to count replies (comments where perentComment matches this comment's _id)
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "perentComment",
                as: "replies"
            }
        },
        // Project the fields you want, including reply count
        {
            $project: {
                _id: 1,
                content: 1,
                attachment: 1,
                postId: 1,
                senderId: {
                    _id: 1,
                    userName: 1,
                    profileImage: 1,
                    verification: 1
                },
                likes: {
                    $map: {
                        input: "$likes",
                        as: "like",
                        in: {
                            _id: "$$like._id",
                            userName: "$$like.userName",
                            profileImage: "$$like.profileImage"
                        }
                    }
                },
                likeCount: { $size: "$likes" }, // From your virtual
                isDeleted: 1,
                createdAt: 1,
                updatedAt: 1,
                replyCount: { $size: { $filter: { input: "$replies", cond: { $eq: ["$$this.isDeleted", false] } } } } // Count non-deleted replies
            }
        },
        // Pagination
        { $skip: skip },
        { $limit: limit }
    ]);

    if (comments.length === 0) {
        return next(new Error(messageSystem.comment.notFound, { cause: 404 }));
    }

    return res.status(200).json({ success: true, data: comments });
};
export const likeUnLike = async (req, res, next) => {
    const { id } = req.params;
    const { userData } = req;
    Comment.schema.set("toJSON", { virtuals: true })
    const comment = await Comment.findById(id);
    if (!comment)
        return next(new Error(messageSystem.comment.notFound, { cause: 404 }))
    const index = comment.likes.indexOf(userData._id)
    if (index == -1) {
        comment.likes.push(userData._id);
        await comment.save()
        return res.status(200).json({
            success: true,
            message: messageSystem.comment.like,
            "likeCount": comment.likeCount
        })
    } else {
        comment.likes.splice(index, 1)
        await comment.save()
        return res.status(200).json({
            success: true,
            message: messageSystem.comment.unLike,
            "likeCount": comment.likeCount
        })
    }
}
