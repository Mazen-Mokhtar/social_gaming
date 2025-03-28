import mongoose from "mongoose";
import { Comment } from "../../model/Comment.model.js";
import Friend from "../../model/friend.model.js";
import Post from "../../model/Post.model.js";
import User from "../../model/User.model.js";
import { notificationEvent } from "../../utils/event/notification/notificaions.js";
import { postEvent } from "../../utils/event/postEvent/clear-post.js";
import { messageSystem } from "../../utils/index.js";
import { cloud, folderNames, operationCloud } from "../../utils/multer/cloudinary.js"


export const creatPost = async (req, res, next) => {
    const { userData } = req;
    let { content, privacy, specific } = req.body;
    let attachment = []
    if (req.files) {
        const folder = folderNames({ userData: userData }).post;
        attachment = await operationCloud(req.files, folder);
    } else {
        attachment = []
    }
    if (specific?.length > 0) {
        privacy = "specific"
    }
    const userPost = await Post.create({ content, attachment, userId: userData._id, privacy, specific });
    await userPost.populate([{ path: "userId", select: "userName profileImage verification" }])
    const userObj = userPost.toObject()
    userObj.isPost = true
    return res.status(200).json({ success: true, data: userObj })
}
export const userPosts = async (req, res, next) => {
    const { userData } = req
    const { page, limit } = req.query;
    const skip = (page - 1) * limit
    User.schema.set("toJSON", { virtuals: false })
    Post.schema.set("toJSON", { virtuals: true });
    const userPosts = await Post.find({ userId: userData._id, isDeleted: false })
        .sort({ "createdAt": -1 })
        .skip(skip).limit(limit)
        .populate("userId", "userName")
    if (userPosts.length === 0)
        return next(new Error(messageSystem.post.notFound, { cause: 404 }))
    const postsWithIsPost = userPosts.map(post => {
        const postObj = post.toObject();
        postObj.isPost = post.userId._id.toString() === userData._id.toString();
        return postObj;
    });
    return res.status(200).json({ success: true, data: postsWithIsPost })
}
export const postDetails = async (req, res, next) => {
    const { postId } = req.params;
    const { userData } = req;
    const { page = 1 } = req.query; // Default page to 1 if not provided
    const limit = 6; // Number of comments per page
    const skip = (page - 1) * limit;

    User.schema.set("toJSON", { virtuals: false });
    Post.schema.set("toJSON", { virtuals: true });
    Post.schema.set("toObject", { virtuals: true });

    const post = await Post.findOne({
        _id: postId,
        isDeleted: false,
        $or: [
            { privacy: "private", userId: userData?._id },
            { privacy: "specific", specific: userData?._id },
            { privacy: { $in: ["public", "onlyFriends"] } },
            { userId: userData?._id }
        ]
    })
        .populate([
            { path: "userId", select: "userName profileImage.secure_url verification" },
            { path: "likes", select: "userName profileImage.secure_url verification" }
        ]);

    if (!post) return next(new Error(messageSystem.post.notFound, { cause: 404 }));

    // Fetch comments using aggregation with pagination
    const comments = await Comment.aggregate([
        // Match top-level comments (no perentComment) for the given postId, not deleted
        {
            $match: {
                perentComment: { $exists: false },
                postId: new mongoose.Types.ObjectId(postId),
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
        { $unwind: "$senderId" },
        // Lookup to populate likes
        {
            $lookup: {
                from: "users",
                localField: "likes",
                foreignField: "_id",
                as: "likes"
            }
        },
        // Lookup to count replies
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "perentComment",
                as: "replies"
            }
        },
        // Project the fields to match getComment
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
                likeCount: { $size: "$likes" },
                isDeleted: 1,
                createdAt: 1,
                updatedAt: 1,
                replyCount: { $size: { $filter: { input: "$replies", cond: { $eq: ["$$this.isDeleted", false] } } } }
            }
        },
        // Pagination
        { $skip: skip },
        { $limit: limit },
        { $sort: { "createdAt": -1 } }
    ]);

    // Attach comments to the post object
    const totalComments = await Comment.countDocuments({
        postId: postId,
        isDeleted: false
    });
    console.log(totalComments)
    // Attach comments and commentCount to the post object
    // Convert post to plain object and attach comments and commentCount
    const postData = post.toObject(); // Convert Mongoose document to plain JS object
    postData.comments = comments; // Attach paginated comments
    postData.commentCount = totalComments; // Override commentCount with the actual value
    // Add isPost field
    postData.isPost = post.userId._id.toString() === userData._id.toString();

    return res.status(200).json({ success: true, data: postData });
};
export const updatePost = async (req, res, next) => {
    const { userData } = req;
    const { postId } = req.params;
    const { content } = req.body;
    const userPost = await Post.findOne(
        { userId: userData._id, _id: postId });
    if (!userPost) return next(new Error(messageSystem.post.invalid, { cause: 404 }))
    let attachment = [];
    if (req.files) {
        const folder = folderNames({ userData: userData }).post;
        attachment = await operationCloud(req.files, folder)
        if (attachment.error) return next(attachment.error)
    } else {
        attachment = []
    }
    await Post.updateOne(
        { userId: userData._id, _id: postId }, { content, attachment });
    if (attachment?.length > 0 && userPost.attachment.length > 0) {
        postEvent.emit("clear", userPost)
    }
    return res.status(200).json({ success: true, message: messageSystem.post.updatedSuccessfully })
}
export const deleteMyPost = async (req, res, next) => {
    const { userData } = req;
    const { postId } = req.params;
    Post.schema.set("toJSON", { virtuals: true })
    const userPost = await Post.findOne({ _id: postId, userId: userData._id })
        .populate([{ path: "comments", select: "_id attachment" }])
    if (!userPost)
        return next(new Error(messageSystem.post.notFound, { cause: 404 }))
    // if (userPost.createdAt < Date.now() - 2 * 60 * 1000)
    //     return next(new Error(messageSystem.post.passedDeleted, { cause: 400 }))
    for (const comment of userPost.comments) {
        await comment.deleteOne();
    }
    await userPost.deleteOne()
    if (userPost.attachment?.length > 0) {
        postEvent.emit("clear", userPost)
    }
    return res.status(200).json(
        {
            success: true,
            message: messageSystem.post.deletedSuccessfully
        })
}
// export const likePost = async (req, res, next) => {
//     const { userData } = req;
//     const { postId } = req.params;
//     const post = await Post.findOneAndUpdate(
//         { _id: postId },
//         { $addToSet: { likes: userData._id } })
//     return res.status(200).json({
//         success: true,
//         message: messageSystem.post.like,
//         likesCount: post.likes.length
//     })
// }
// export const unlikePost = async (req, res, next) => {
//     const { userData } = req;
//     const { postId } = req.params;
//     const post = await Post.findOneAndUpdate(
//         { _id: postId },
//         { $pull: { likes: userData._id } })
//     return res.status(200).json({
//         success: true,
//         message: messageSystem.post.unLike,
//         likesCount: post.likes.length
//     })
// }
export const likeUnLike = async (req, res, next) => {
    const { userData } = req;
    const { postId } = req.params
    const post = await Post.findById(postId)
    if (!post)
        return next(new Error(messageSystem.post.notFound))
    const check = post.likes.indexOf(userData._id);
    if (check == -1) {
        post.likes.push(userData._id);
        await post.save()
        if (post.userId.toString() !== userData._id.toString())
            notificationEvent.emit("send", { type: "like", sender: userData._id, postId, userId: post.userId })
        return res.status(200).json({ success: true, message: messageSystem.post.like, likeCount: post.likes.length || 0 })
    }
    else {
        post.likes.splice(check, 1);
        await post.save()
        return res.status(200).json({ success: true, message: messageSystem.post.unLike, likeCount: post.likes.length || 0 })
    }

}
export const searchPost = async (req, res, next) => {
    const { search } = req.query;
    const { userData } = req;
    User.schema.set("toJSON", { virtuals: false })
    const posts = await Post.find(
        {
            isDeleted: false,
            $or: [
                { privacy: "private", userId: userData?._id },
                { privacy: "specific", specific: userData?._id },
                { privacy: { $in: ["public", "onlyFriends"] } },
                { userId: userData?._id }
            ],
            content: { $regex: search, $options: "i" }
        }).populate("userId", "userName")
    if (posts.length === 0)
        return next(new Error(messageSystem.post.notFound, { cause: 404 }))
    // Add isPost field
    const postsWithIsPost = posts.map(post => {
        const postObj = post.toObject();
        postObj.isPost = post.userId._id.toString() === userData._id.toString();
        return postObj;
    });
    return res.status(200).json({ success: true, data: postsWithIsPost })
}
export const forYouPosts = async (req, res, next) => {
    const { userData } = req;
    const fyp = await Friend.aggregate([
        {
            $match: {
                $or: [
                    { resverId: userData._id, confirmReq: true },
                    { senderId: userData._id, confirmReq: true }
                ]
            }
        }
        ,
        {
            $addFields: {
                friendId:
                {

                    $cond: {
                        if: { $eq: ["$senderId", userData._id] },
                        then: "$resverId",
                        else: "$senderId"
                    }

                }
            }
        }
        ,
        {
            $lookup: {
                from: "posts",
                localField: "friendId",
                foreignField: "userId",
                as: "friendsPost"
            }
        },
        { $unwind: "$friendsPost" },
        {
            $match: {
                "friendsPost.isDeleted": false,
                $expr: {
                    $or: [

                        {
                            $and:
                                [
                                    { $eq: ["$friendsPost.privacy", "private"] },
                                    { $eq: ["$friendsPost.userId", userData._id] }
                                ]
                        },
                        {
                            $and: [
                                { $eq: ["$friendsPost.privacy", "specific"] },
                                { $in: [userData._id, "$friendsPost.specific"] }
                            ]
                        },
                        { $in: ["$friendsPost.privacy", ["public", "onlyFriends"]] }
                    ]
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "friendsPost.userId",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        { $unwind: "$userDetails" },
        {
            $lookup: {
                from: "comments", // The name of the comments collection in MongoDB (lowercase of model name)
                localField: "friendsPost._id",
                foreignField: "postId",
                as: "postComments"
            }
        },
        {
            $sort: { "friendsPost.createdAt": -1 } // ترتيب تنازلي عشان يجيب الأحدث أولاً
        },
        // Add the comment count to the projection
        {
            $project: {
                _id: 0,
                friendsPost: {
                    _id: 1,
                    content: 1,
                    attachment: 1,
                    likes: 1,
                    privacy: 1,
                    createdAt: 1,
                    commentCount: { $size: { $filter: { input: "$postComments", cond: { $eq: ["$$this.isDeleted", false] } } } } // Count only non-deleted comments
                },
                userDetails: {
                    _id: 1,
                    userName: 1,
                    profileImage: 1,
                    verification: 1
                }
            }
        }

    ])
    if (fyp.length === 0) return next(new Error(messageSystem.post.notFound, { cause: 404 }));
    // Add isPost field
    const postsWithIsPost = fyp.map(item => {
        item.friendsPost.isPost = item.userDetails._id.toString() === userData._id.toString();
        return item;
    });
    return res.status(200).json({ success: true, data: postsWithIsPost })
}
export const archive = async (req, res, next) => {
    const { postId } = req.params;
    const { userData } = req;
    const post = await Post.findOne({ _id: postId, userId: userData._id, isDeleted: false });
    if (!post)
        return next(new Error(messageSystem.post.notFound, { cause: 404 }));
    // if (post.createdAt > Date.now() - 24 * 60 * 60 * 1000)
    //     return next(new Error(messageSystem.post.mustPassed, { cause: 400 }))
    post.isDeleted = true;
    await post.save();
    return res.status(200).json({ success: true, message: messageSystem.post.archive })
}
export const undoArchive = async (req, res, next) => {
    const { postId } = req.params;
    const { userData } = req;
    const post = await Post.findOne({ _id: postId, userId: userData._id })
    if (!post)
        return next(new Error(messageSystem.post.notFound, { cause: 404 }));
    if (post.isDeleted == false)
        return next(new Error(messageSystem.post.alreadyExist))
    post.isDeleted = false;
    await post.save();
    return res.status(200).json({ success: true, message: messageSystem.post.undoArchive });
}
export const userPostsId = async (req, res, next) => {
    const { id } = req.params; // The ID of the user whose posts we're fetching
    const { page, limit } = req.query;
    const { userData } = req; // The authenticated user's data from middleware
    const skip = (page - 1) * limit;

    Post.schema.set("toJSON", { virtuals: true });
    User.schema.set("toJSON", { virtuals: false });

    const userPosts = await Post.find({ userId: id, isDeleted: false })
        .sort({ "createdAt": -1 })
        .skip(skip)
        .limit(limit)
        .populate([{
            path: "userId",
            select: "userName profileImage verification"
        }, {
            path: "comments"
        }]);

    if (userPosts.length === 0) {
        return next(new Error(messageSystem.post.notFound, { cause: 404 }));
    }

    // Map through posts and add isPost field
    const postsWithIsPost = userPosts.map(post => {
        const postObj = post.toObject(); // Convert Mongoose document to plain object
        postObj.isPost = post.userId._id.toString() === userData._id.toString(); // Compare userId with userData._id
        return postObj;
    });

    return res.status(200).json({
        success: true,
        data: postsWithIsPost
    });
};