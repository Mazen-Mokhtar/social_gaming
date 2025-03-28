import User from "../model/User.model.js";
import { messageSystem } from "../utils/index.js";

export const authorized = async (req, res, next) => {
    const data = req;
    const user = await User.findById(data.userId);
    if (!user) return next(new Error(messageSystem.user.notFound, { cause: 404 }));
    if (user.role !== "admin") return next(new Error(messageSystem.user.notAuthorized, { cause: 401 }))
    return next()
}
