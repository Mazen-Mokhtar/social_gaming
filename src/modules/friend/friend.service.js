import mongoose from "mongoose";
import Friend from "../../model/friend.model.js";
import User from "../../model/User.model.js";
import { messageSystem } from "../../utils/index.js";
import { notificationEvent } from "../../utils/event/notification/notificaions.js";

export const sendFriendRequest = async (req, res, next) => {
    const { userData } = req;
    const { id } = req.params;
    if (userData._id.toString() == id)
        return next(new Error(messageSystem.user.invalid, { cause: 400 }))
    if (userData.blocked.includes(id))
        return next(new Error(messageSystem.friend.youBlocked, { cause: 404 }))
    const cheakUser = await User.findById(id);
    if (!cheakUser) return next(new Error(messageSystem.user.notFound, { cause: 404 }));
    if (cheakUser.blocked.includes(userData._id))
        return next(new Error(messageSystem.friend.heBlocked, { cause: 404 }))
    const cheakFriend = await Friend.findOne({
        $or: [{
            senderId: userData._id,
            resverId: cheakUser._id
        }, {
            senderId: cheakUser._id,
            resverId: userData._id
        }]

    })
    // console.log(cheakFriend)
    if (cheakFriend && cheakFriend.confirmReq == false) {
        return next(new Error(messageSystem.friend.alreadyExist))
    } else if (cheakFriend && cheakFriend.confirmReq == true) {
        return next(new Error(messageSystem.friend.alreadyFriends, { cause: 400 }))
    }
    await Friend.create({
        senderId: userData._id,
        resverId: cheakUser._id,
        pending: true
    })
    notificationEvent.emit("send", { type: "frinedRequest", sender: userData._id, userId: id })
    return res.status(201).json({ success: true, message: messageSystem.friend.createdSuccessfully })
}
export const cancelFriendRequest = async (req, res, next) => {
    const { userData } = req;
    const { id } = req.params;

    // Check if trying to cancel request to self
    if (userData._id.toString() === id)
        return next(new Error(messageSystem.user.invalid, { cause: 400 }));

    // Check if target user exists
    const targetUser = await User.findById(id);
    if (!targetUser)
        return next(new Error(messageSystem.user.notFound, { cause: 404 }));

    // Find the friend request
    const friendRequest = await Friend.findOne({
        senderId: userData._id,
        resverId: targetUser._id,
        confirmReq: false,
        pending: true // Only pending requests
    });

    // If no request found or it's already confirmed
    if (!friendRequest) {
        return next(new Error(messageSystem.friend.requestNotFound, { cause: 404 }));
    }

    // Delete the friend request
    await Friend.deleteOne({
        _id: friendRequest._id
    });

    return res.status(200).json({
        success: true,
        message: messageSystem.friend.requestCancelled
    });
};
export const cancelFriend = async (req, res, next) => {
    const { userData } = req
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user)
        return next(new Error(messageSystem.user.notFound, { cause: 404 }))
    const index = userData.friends.includes(id)
    if (!index)
        return next(new Error(messageSystem.friend.notFound))
    await Promise.all([User.updateOne(
        { _id: userData._id },
        { $pull: { friends: id } }
    ),
    User.updateOne(
        { _id: id },
        { $pull: { friends: userData._id } }
    ),
    Friend.deleteOne({
        $or: [{
            senderId: userData._id,
            resverId: id
        }, {
            senderId: id,
            resverId: userData._id
        }]
    })])
    return res.status(200).json({ success: true, message: messageSystem.friend.cancelFriend })
}
export const confiremOrDelete = async (req, res, next) => {
    const { userData } = req
    const { profile_id, status } = req.query;
    const senderUser = await User.findById(profile_id)
    if (status == "confirmReq") {
        const cheak = await Friend.findOneAndUpdate(
            { resverId: userData._id, senderId: profile_id, confirmReq: false },
            { confirmReq: true, pending: false });
        if (!cheak) return next(new Error(messageSystem.user.notFound, { cause: 404 }));
        userData.friends?.push(profile_id);
        senderUser.friends?.push(userData._id);
        await userData.save()
        await senderUser.save()
    }
    if (status == "delete") {
        const cheak = await Friend.findOneAndDelete({ resverId: userData._id, senderId: profile_id });
        if (!cheak) return next(new Error(messageSystem.user.notFound, { cause: 404 }));
    }
    return res.status(200).json({ success: true })
}
export const getFriends = async (req, res, next) => {
    const { userData } = req;
    const yourFrinds = await Friend.aggregate([
        {
            $match: {
                $or: [
                    { resverId: userData._id, confirmReq: true },
                    { senderId: userData._id, confirmReq: true }
                ]
            }
        }, {
            $addFields:
            {
                friendId: {
                    $cond: {
                        if: { $eq: ["$senderId", userData._id] },
                        then: "$resverId",
                        else: "$senderId"
                    }
                }
            }
        },
        {
            $lookup:
            {
                from: "users",
                localField: "friendId",
                foreignField: "_id",
                as: "friendDetails"
            }
        },
        {
            $unwind: "$friendDetails"
        },
        {
            $project:
            {
                _id: 0,
                "friendDetails":
                {
                    _id: 1,
                    userName: 1,
                    email: 1,
                    profileImage: 1,
                    verification: 1
                }
            }
        }
    ])
    if (yourFrinds.length === 0) return next(new Error(messageSystem.friend.noFriends, { cause: 404 }))
    return res.status(200).json({ success: true, data: yourFrinds })
}
export const getRequsetFrinds = async (req, res, next) => {
    const { userData } = req;

    // First, get the current user's friends
    let myFriends = await Friend.find({
        confirmReq: true,
        $or: [
            { resverId: userData._id },
            { senderId: userData._id }
        ]
    });

    myFriends = myFriends.map((obj) => {
        return obj.senderId.equals(userData._id) ? obj.resverId : obj.senderId;
    });

    await Friend.updateMany(
        { resverId: userData._id, confirmReq: false },
        { $set: { isRead: true } }
    );

    const yourReqFrinds = await Friend.aggregate([
        {
            $match: { resverId: userData._id, confirmReq: false }
        },
        {
            $lookup: {
                from: "users",
                localField: "senderId",
                foreignField: "_id",
                as: "friendsReq"
            }
        },
        { $unwind: "$friendsReq" },
        // Add lookup for sender's friends
        {
            $lookup: {
                from: "friends",
                let: { senderId: "$senderId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$confirmReq", true] },
                                    {
                                        $or: [
                                            { $eq: ["$senderId", "$$senderId"] },
                                            { $eq: ["$resverId", "$$senderId"] }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            friendId: {
                                $cond: {
                                    if: { $eq: ["$senderId", "$$senderId"] },
                                    then: "$resverId",
                                    else: "$senderId"
                                }
                            }
                        }
                    }
                ],
                as: "senderFriends"
            }
        },
        // Calculate mutual friends count
        {
            $project: {
                _id: 0,
                friendsReq: {
                    _id: 1,
                    userName: 1,
                    email: 1,
                    profileImage: 1,
                    verification: 1
                },
                mutualFriendsCount: {
                    $size: {
                        $setIntersection: [
                            "$senderFriends.friendId",
                            myFriends
                        ]
                    }
                }
            }
        }
    ]);

    if (yourReqFrinds.length === 0)
        return next(new Error(messageSystem.friend.notFound));

    return res.status(200).json({ success: true, data: yourReqFrinds });
};
export const searchForFriends = async (req, res, next) => {
    const { userData } = req;
    const { search } = req.query;

    // التحقق من وجود userData
    if (!userData || !userData._id) {
        return next(new Error("User data not found", { cause: 401 }));
    }

    // التحقق من وجود search وتعيين قيمة افتراضية
    const searchTerm = search || "";

    const yourFriends = await Friend.aggregate([
        // فلترة الأصدقاء المؤكدين
        {
            $match: {
                $or: [
                    { resverId: userData._id, confirmReq: true },
                    { senderId: userData._id, confirmReq: true }
                ]
            }
        },
        // إضافة حقل ديناميكي لتحديد ID الصديق
        {
            $project: {
                friendId: {
                    $cond: {
                        if: { $eq: ["$senderId", userData._id] },
                        then: "$resverId",
                        else: "$senderId"
                    }
                }
            }
        },
        // جلب بيانات الصديق
        {
            $lookup: {
                from: "users",
                localField: "friendId",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $unwind: "$userDetails"
        },
        // البحث باستخدام regex
        {
            $match: {
                "userDetails.userName": { $regex: new RegExp(searchTerm, "i") }
            }
        },
        // تحديد الحقول المطلوبة
        {
            $project: {
                _id: 0,
                "userDetails": {
                    _id: 1,
                    userName: 1,
                    email: 1,
                    profileImage: 1,
                    verification: 1
                }
            }
        }
    ]);

    if (yourFriends.length === 0) {
        return next(new Error(messageSystem.friend.noFriends, { cause: 404 }));
    }

    return res.status(200).json({ success: true, data: yourFriends });
};
export const suggestionsFriends = async (req, res, next) => {
    const { userData } = req;
    let yourFrinds = await Friend.find({
        $or: [
            { resverId: userData._id, confirmReq: true },
            { senderId: userData._id, confirmReq: true }
        ],
        delete: false
    });

    if (yourFrinds.length === 0)
        return next(new Error(messageSystem.friend.suggestions, { cause: 404 }));

    yourFrinds = yourFrinds.map((obj) => {
        return obj.senderId.equals(userData._id) ? obj.resverId : obj.senderId;
    });

    const suggestions = await Friend.aggregate([
        {
            $match: {
                $or: [
                    { resverId: { $in: yourFrinds }, senderId: { $nin: yourFrinds, $ne: userData._id }, confirmReq: true, delete: false },
                    { senderId: { $in: yourFrinds }, resverId: { $nin: yourFrinds, $ne: userData._id }, confirmReq: true, delete: false }
                ]
            }
        },
        {
            $addFields: {
                friendId: {
                    $cond: {
                        if: { $in: ["$resverId", yourFrinds] },
                        then: "$senderId",
                        else: "$resverId"
                    }
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "friendId",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $match: {
                $expr: {
                    $not: { $in: ["$userDetails._id", userData.blocked] }
                }
            }
        },
        {
            $lookup: {
                from: "friends",
                let: { suggestion: "$userDetails._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $or: [
                                            { $eq: ["$resverId", "$$suggestion"] },
                                            { $eq: ["$senderId", "$$suggestion"] }
                                        ]
                                    },
                                    {
                                        $or: [
                                            { $in: ["$resverId", yourFrinds] },
                                            { $in: ["$senderId", yourFrinds] }
                                        ]
                                    },
                                    { $eq: ["$confirmReq", true] },
                                    { $eq: ["$delete", false] }
                                ]
                            }
                        }
                    }
                ],
                as: "mutualFriends"
            }
        },
        {
            $lookup: {
                from: "friends",
                let: { suggestionId: "$userDetails._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$confirmReq", false] },
                                    { $eq: ["$pending", true] },
                                    { $eq: ["$delete", false] },
                                    {
                                        $or: [
                                            {
                                                $and: [
                                                    { $eq: ["$senderId", userData._id] },
                                                    { $eq: ["$resverId", "$$suggestionId"] }
                                                ]
                                            },
                                            {
                                                $and: [
                                                    { $eq: ["$resverId", userData._id] },
                                                    { $eq: ["$senderId", "$$suggestionId"] }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            senderId: 1  // Include senderId in the lookup result
                        }
                    }
                ],
                as: "pendingRequest"
            }
        },
        {
            $addFields: {
                countMutualFriends: { $size: "$mutualFriends" },
                pending: { $gt: [{ $size: "$pendingRequest" }, 0] },
                senderId: {
                    $cond: {
                        if: { $gt: [{ $size: "$pendingRequest" }, 0] },
                        then: { $arrayElemAt: ["$pendingRequest.senderId", 0] },
                        else: null
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                "userDetails": {
                    _id: 1,
                    userName: 1,
                    email: 1,
                    profileImage: 1,
                    verification: 1
                },
                countMutualFriends: 1,
                pending: 1,
                senderId: 1
            }
        }
    ]);

    if (suggestions.length === 0)
        return next(new Error(messageSystem.friend.suggestions, { cause: 404 }));

    return res.status(200).json({ success: true, data: suggestions });
};
export const mutualFriends = async (req, res, next) => {
    const { userData } = req;
    const { id } = req.params;

    if (userData._id.toString() === id)
        return next(new Error(messageSystem.user.notAuthorized, { cause: 401 }));

    // Get current user's friends
    let userFriends = await Friend.find({
        $or: [
            { resverId: userData._id, confirmReq: true, delete: false },
            { senderId: userData._id, confirmReq: true, delete: false }
        ]
    });

    if (userFriends.length === 0)
        return next(new Error(messageSystem.friend.mutualFriends, { cause: 404 }));

    userFriends = userFriends.map((obj) => {
        return obj.senderId.equals(userData._id) ? obj.resverId : obj.senderId;
    });

    const mutual = await Friend.aggregate([
        // Match friendships involving the target user (id) and current user's friends
        {
            $match: {
                confirmReq: true,
                delete: false,
                $or: [
                    { resverId: new mongoose.Types.ObjectId(id), senderId: { $in: userFriends } },
                    { senderId: new mongoose.Types.ObjectId(id), resverId: { $in: userFriends } }
                ]
            }
        },
        // Determine which ID is the mutual friend
        {
            $addFields: {
                friendId: {
                    $cond: {
                        if: { $eq: ["$resverId", new mongoose.Types.ObjectId(id)] },
                        then: "$senderId",
                        else: "$resverId"
                    }
                }
            }
        },
        // Lookup user details
        {
            $lookup: {
                from: "users",
                localField: "friendId",
                foreignField: "_id",
                as: "friendDetails"
            }
        },
        { $unwind: "$friendDetails" },
        // Check blocking status
        {
            $lookup: {
                from: "users",
                let: { friendId: "$friendId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    { $eq: ["$_id", userData._id] },
                                    { $eq: ["$_id", new mongoose.Types.ObjectId(id)] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            blocked: 1
                        }
                    }
                ],
                as: "userBlocks"
            }
        },
        // Filter out blocked users
        {
            $match: {
                $expr: {
                    $and: [
                        { $not: { $in: ["$friendId", { $arrayElemAt: ["$userBlocks.blocked", 0] }] } },
                        { $not: { $in: ["$friendId", { $arrayElemAt: ["$userBlocks.blocked", 1] }] } },
                        { $not: { $in: [userData._id, "$friendDetails.blocked"] } },
                        { $not: { $in: [new mongoose.Types.ObjectId(id), "$friendDetails.blocked"] } }
                    ]
                }
            }
        },
        // Project the final fields
        {
            $project: {
                _id: 0,
                friendDetails: {
                    _id: "$friendDetails._id",
                    userName: "$friendDetails.userName",
                    email: "$friendDetails.email",
                    profileImage: "$friendDetails.profileImage",
                    verification: "$friendDetails.verification"
                }
            }
        },
        // Group to get all mutual friends and count
        {
            $group: {
                _id: null,
                mutualFriends: { $push: "$friendDetails" },
                countMutualFriends: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                mutualFriends: 1,
                countMutualFriends: 1
            }
        }
    ]);

    if (mutual.length === 0 || !mutual[0].mutualFriends.length)
        return next(new Error(messageSystem.friend.mutualFriends, { cause: 404 }));

    return res.status(200).json({ success: true, data: mutual[0] });
};
export const blockUser = async (req, res, next) => {
    const { userData } = req;
    let { id } = req.params;
    id = new mongoose.Types.ObjectId(id)
    const cheakUser = await User.findById(id)
    if (!cheakUser) return next(new Error(messageSystem.user.notFound))
    const status = userData.blocked.includes(id)
    if (status) return next(new Error(messageSystem.friend.alreadyblocked, { cause: 400 }))
    userData.blocked.push(id);
    const cheakFriendStatus = userData.friends.includes(id)
    console.log(cheakFriendStatus)
    if (cheakFriendStatus) {
        await Promise.all([User.updateOne(
            { _id: userData._id },
            { $pull: { friends: id } }
        ),
        User.updateOne(
            { _id: id },
            { $pull: { friends: userData._id } }
        ),
        Friend.deleteOne({
            $or: [{
                senderId: userData._id,
                resverId: id
            }, {
                senderId: id,
                resverId: userData._id
            }]
        })])
    }
    await userData.save()
    return res.status(200).json(
        {
            success: true,
            message: `${cheakUser.userName} Blocked Successfully`
        })

}
export const unBlockUser = async (req, res, next) => {
    const { userData } = req;
    let { id } = req.params;
    id = new mongoose.Types.ObjectId(id)
    const cheakUser = await User.findById(id);
    if (!cheakUser) return next(new Error(messageSystem.user.notFound, { cause: 404 }))
    const cheakBlockIndex = userData.blocked.indexOf(id);
    if (cheakBlockIndex == -1)
        return next(new Error(`${cheakUser.userName} Is Already Not In blocklist`))
    userData.blocked.splice(cheakBlockIndex, 1);
    await userData.save()
    return res.status(200).json({ success: true, message: `You Un block ${cheakUser.userName}` })
}

export const countRequsetFrinds = async (req, res, next) => {
    const { userData } = req;

    let countRequsetFrinds = await Friend.countDocuments(
        {
            confirmReq: false,
            resverId: userData._id,
            pending: true,
            isRead: false
        }
    );
    return res.status(200).json({ success: true, data: countRequsetFrinds });
};
