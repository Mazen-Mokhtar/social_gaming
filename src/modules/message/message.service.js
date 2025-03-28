import mongoose from "mongoose";
import Friend from "../../model/friend.model.js";
import Message from "../../model/Message.model.js";
import { messageSystem } from "../../utils/index.js";
import { operationCloud } from "../../utils/multer/cloudinary.js";
import { postEvent } from "../../utils/event/postEvent/clear-post.js";
import User from "../../model/User.model.js";


export const sendMessages = async (req, res, next) => {
    const { userData } = req;
    let { id } = req.params;
    id = new mongoose.Types.ObjectId(id);
    if (userData._id.toString() === id.toString())
        return next(new Error(messageSystem.message.cSendYourSelf, { cause: 400 }))
    let status = "friends";
    const cheakFriends = await Friend.findOne({
        $or: [
            { senderId: userData._id, resverId: id, confirmReq: true },
            { senderId: id, resverId: userData._id, confirmReq: true }
        ]
    })
    if (!cheakFriends)
        status = "requests"
    let attachment = []
    if (req.files) {
        const folder = { folder: `social-app/users/${userData._id}/photo-Message/${id}` }
        attachment = await operationCloud(req.files, folder)
    } else {
        attachment = []
    }
    const message = (await Message.create(
        {
            content: req.body.content,
            attachment,
            status, senderId: userData._id,
            resverId: id
        }));
    return res.status(200).json({
        message: messageSystem.message.createdSuccessfully,
        data: { content: req.body.content, attachment, id: message._id }
    })
}
export const conversations = async (req, res, next) => {
    const { userData } = req;

    // جلب الأصدقاء من حقل friends في جدول User
    const user = await User.findById(userData._id).select('friends');
    const friendsList = user.friends;

    // تجميع الرسائل بين الأصدقاء
    const messagesAgg = await Message.aggregate([
        {
            $match: {
                $or: [
                    { senderId: userData._id, status: "friends" },
                    { resverId: userData._id, status: "friends" }
                ]
            }
        },
        {
            $addFields: {
                friendMessageId: {
                    $cond: {
                        if: { $eq: ["$senderId", userData._id] },
                        then: "$resverId",
                        else: "$senderId"
                    }
                }
            }
        },
        {
            $facet: {
                countUnRead: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$senderId", "$friendMessageId"] },
                                    { $eq: ["$resverId", userData._id] },
                                    { $eq: ["$read", false] }
                                ]
                            }
                        }
                    },
                    { $group: { _id: "$friendMessageId", count: { $sum: 1 } } }
                ],
                groupMessage: [
                    { $sort: { updatedAt: -1 } },
                    {
                        $group: {
                            _id: "$friendMessageId",
                            lastMessage: { $first: "$$ROOT" }
                        }
                    }
                ]
            }
        }
    ]);

    // تحويل الأصدقاء إلى Set لتسهيل المقارنة
    const friendsSet = new Set(friendsList.map(id => id.toString()));
    const messageFriendsSet = new Set();

    // معالجة الرسائل المجمعة
    let conversations = [];
    if (messagesAgg.length > 0) {
        const { countUnRead, groupMessage } = messagesAgg[0];

        conversations = groupMessage.map(group => {
            const friendId = group._id.toString();
            messageFriendsSet.add(friendId);
            const unread = countUnRead.find(un => un._id.toString() === friendId);
            return {
                friendId: group._id,
                lastMessage: group.lastMessage,
                countUnRead: unread ? unread.count : 0
            };
        });
    }

    // إضافة الأصدقاء الذين ليس لهم رسائل مع رسالة افتراضية "Say hi"
    const missingFriends = friendsList.filter(friendId => !messageFriendsSet.has(friendId.toString()));
    missingFriends.forEach(friendId => {
        conversations.push({
            friendId,
            lastMessage: {
                _id: null,
                content: "Say hi",
                attachment: [],
                updatedAt: new Date()
            },
            countUnRead: 0
        });
    });

    // جلب تفاصيل المستخدمين لكل صديق في المحادثات
    const convWithUserDetails = await Promise.all(conversations.map(async (conv) => {
        const userDetails = await User.findById(conv.friendId)
            .select('_id userName profileImage verification');
        return {
            conversations: {
                lastMessage: {
                    _id: conv.lastMessage._id,
                    content: conv.lastMessage.content,
                    attachment: conv.lastMessage.attachment,
                    updatedAt: conv.lastMessage.updatedAt
                },
                countUnRead: conv.countUnRead
            },
            userDetails
        };
    }));

    // ترتيب المحادثات حسب تاريخ آخر رسالة
    convWithUserDetails.sort((a, b) => new Date(a.conversations.lastMessage.updatedAt) - new Date(b.conversations.lastMessage.updatedAt));

    if (convWithUserDetails.length === 0) {
        return next(new Error(messageSystem.message.notFound, { cause: 404 }));
    }

    return res.status(200).json({ success: true, data: convWithUserDetails });
};
export const deleteMessage = async (req, res, next) => {
    const { id } = req.params;
    const { userData } = req;
    const userMessage = await Message.findOne({ _id: id, senderId: userData._id });
    if (!userMessage)
        return next(new Error(messageSystem.message.notFound, { cause: 404 }))
    if (userMessage.attachment?.length > 0) {
        postEvent.emit("clear", userMessage)
    }
    userMessage.set({
        content: `this message deleted ${userData.userName}`,
        read: undefined, attachment: []
    })
    await userMessage.save()
    return res.status(200).json({ success: true, message: messageSystem.message.deletedSuccessfully })
}
export const softDeleteMessage = async (req, res, next) => {
    const { id } = req.params;
    const { userData } = req;
    const userMessage = await Message.findOne(
        {
            _id: id,
            $or: [{ senderId: userData._id, isDeletedSenderId: false }, { resverId: userData._id, isDeletedResverId: false }]
        })
    if (!userMessage)
        return next(new Error(messageSystem.message.notFound, { cause: 404 }))
    if (userMessage.senderId.toString() == userData._id.toString()) {
        userMessage.isDeletedSenderId = true;
    } else {
        userMessage.isDeletedResverId = true;
    }
    await userMessage.save();
    return res.status(200).json(
        { success: true, message: messageSystem.message.deletedSuccessfully })
}
export const getChat = async (req, res, next) => {
    const { id } = req.params;
    const { userData } = req;
    console.log({ id, userData })
    const cheakk = await Message.updateMany(
        { resverId: userData._id, senderId: id, read: false },
        { read: true })
    const chat = await Message.find({
        $or: [
            { senderId: userData._id, resverId: id, isDeletedSenderId: false },
            { senderId: id, resverId: userData._id, isDeletedResverId: false }
        ]
    }).sort({ createdAt: 1 }).select("-isDeletedSenderId -isDeletedResverId").populate([{ path: "senderId", select: "_id profileImage verification" }, { path: "resverId", select: "_id profileImage verification" }])
    if (chat.length == 0)
        return next(new Error(messageSystem.message.chatNotFound, { cause: 404 }))
    const updatedMessages = await Message.find({
        resverId: userData._id,
        senderId: id,
        read: true
    });
    console.log({ chat: chat, number: cheakk })
    return res.status(200).json({ success: true, data: chat })
}
