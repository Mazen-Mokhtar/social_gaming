import { Router } from "express";
import { authorizationV2 } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/index.js";
import { countNotifications, getNotification } from "./notification.service.js";

const router = Router()

router.get("/", authorizationV2, asyncHandler(getNotification))
router.get("/count", authorizationV2, asyncHandler(countNotifications))

export default router