import Notification from "../../model/Notification.model.js";




export const getNotification = async (req, res, next) => {
    const { userData } = req;
    const noifications = await Notification.find({ user: userData._id })
        .populate([{ path: "sender", select: "userName profileImage verification" }]).sort({ createdAt: -1 })
    await Notification.updateMany({ user: userData._id }, { isRead: true })
    return res.status(200).json(
        { success: true, data: noifications })
}
export const countNotifications = async (req, res, next) => {
    const { userData } = req;
    const countNoifications = await Notification.countDocuments({ user: userData._id, isRead: false })
    return res.status(200).json(
        { success: true, data: countNoifications })
}