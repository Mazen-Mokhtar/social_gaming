import Friend from "../../model/friend.model.js"
import Message from "../../model/Message.model.js"
import User from "../../model/User.model.js"
import { messageSystem } from "../../utils/index.js"
import { cloud, folderNames } from "../../utils/multer/cloudinary.js"

export const getProfile = async (req, res, next) => {
    const { userData } = req
    User.schema.set("toJSON", { virtuals: false })
    if (userData.resetCode || userData.resetCodeExpire) {
        userData.resetCode = undefined
        userData.resetCodeExpire = undefined;
    }
    await userData.save();
    await userData.populate([
        { path: "friends", select: "userName profileImage isOnline" },
        { path: "viewYourProfile", select: "userName profileImage" }
    ])
    userData.phone = userData.realPhone();
    const friendsWithUnread = await Promise.all(userData.friends.map(async (friend) => {
        const countUnread = await Message.countDocuments({
            senderId: friend._id,
            resverId: userData._id,
            read: false
        })
        return { ...friend.toJSON(), countUnread }
    }))

    const userDataObject = userData.toObject();
    userDataObject.friends = friendsWithUnread;
    // console.log({ friendsWithUnread })
    // console.log(userData)
    return res.status(200).json({ success: true, data: userDataObject })
}
export const getUserProfile = async (req, res, next) => {
    const { userData } = req;
    const { id } = req.params;
    // if (userData._id.toString() == id)
    //     return next(new Error(messageSystem.user.notAuthorized, { cause: 401 }))
    const user = await User.findById(id)
        .select("-provider -role -email -password -phone -confirmEmail -isDeleted ")


    if (!user)
        return next(new Error(messageSystem.user.notFound, { cause: 404 }))
    if (user.blocked.includes(userData._id))
        return next(new Error(messageSystem.user.notFound, { cause: 404 }))
    let countMutual = 0;
    for (let otherUser = 0; otherUser < userData.friends.length; otherUser++) {
        const cheak = user.friends.includes(userData.friends[otherUser])
        if (cheak) {
            countMutual++;
        }
    }
    const indexOfview = user.viewYourProfile.includes(userData._id)
    if (!indexOfview) {
        user.viewYourProfile.push(userData._id);
        await user.save()
    }
    console.log(indexOfview)
    const index = user.friends.indexOf(userData._id)
    if (index != -1) {
        user.friends.splice(index, 1)
    }
    await user.populate([
        { path: "friends", select: "userName profileImage" }
    ])
    let status = "addFriend";
    const cheak = await Friend.findOne({
        $or: [{
            senderId: userData._id,
            resverId: id
        }, {
            senderId: id,
            resverId: userData._id
        }]
    })
    if (cheak && cheak.confirmReq == true) {
        status = "isFriends"
    } else if (cheak && cheak.pending == true && cheak.senderId.toString() == userData._id.toString()) {
        status = "cancelRequest"
    } else if (cheak && cheak.pending == true && cheak.senderId.toString() !== userData._id.toString()) {
        status = "confirmRequest"
    }
    let isMe = false;
    if (userData._id.toString() === user._id.toString())
        isMe = true
    const userObj = user.toObject();
    userObj.countMutual = countMutual;
    userObj.viewYourProfile = undefined
    userObj.status = status
    userObj.isMe = isMe
    return res.status(200).json({ success: true, data: userObj })
}
export const getAllUser = async (req, res, next) => {
    const { userData } = req
    if (userData.role !== "admin") return next(new Error(messageSystem.user.notAuthorized, { cause: 401 }))
    const users = await User.find().select("-password -confirmEmail -__v -isDeleted -deletedAt");
    const usersUpdated = users.map((obj) => {
        obj.phone = obj.realPhone()
        return obj
    })
    if (users.length === 0) return next(new Error(messageSystem.user.notFound, { cause: 404 }));
    return res.status(200).json({ success: true, data: usersUpdated });
}
export const updateProfile = async (req, res, next) => {
    const { userData } = req;
    const { phone, password, DOB, userName, gender } = req.body;

    if (userName !== undefined && userName !== '') userData.userName = userName;
    if (phone !== undefined && phone !== '') {
        userData.isModified("phone")
        userData.phone = phone;
    }
    if (gender !== undefined && gender !== '') userData.gender = gender;
    if (DOB !== undefined && DOB !== '') userData.DOB = DOB;
    if (password !== undefined && password !== '') {
        userData.isModified("password")
        userData.password = password;
    }

    try {
        await userData.save();
        return res.status(200).json({
            success: true,
            message: messageSystem.user.updatedSuccessfully
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
export const updateImage = async (req, res, next) => {
    const { userData } = req;
    let options = {};
    if (userData.profileImage && userData.profileImage.public_id) {
        options.public_id = userData.profileImage.public_id;
    } else {
        options.folder = folderNames({ userData }).profile;
    }
    const { secure_url, public_id } = await cloud().uploader.upload(req.file.path, options);
    userData.profileImage = { secure_url, public_id };
    await userData.save();
    return res.status(200).json({ success: true, data: userData });
}
export const search = async (req, res, next) => {
    const { userData } = req;
    const { search } = req.query;

    User.schema.set("toJSON", { virtuals: false });

    const users = await User.find({
        userName: { $regex: search, $options: "i" }, // البحث بناءً على اسم المستخدم (غير حساس لحالة الأحرف)
        _id: { $ne: userData._id }, // استبعاد المستخدم نفسه باستخدام _id
        _id: { $nin: userData.blocked || [] } // استبعاد المستخدمين المحظورين
    }).select("userName profileImage gender verification"); // تحديد الحقول المراد إرجاعها فقط

    if (users.length === 0) {
        return next(new Error(messageSystem.notFound, { cause: 404 }));
    }

    // إرجاع البيانات بدون أي معلومات إضافية مثل العدد
    return res.status(200).json({ success: true, data: users });
};