import { Router } from "express";
import * as friendService from "./friend.service.js";
import { authorizationV2, validation } from "../../middleware/index.js";
import * as schema from "./friend.validation.js";
import { asyncHandler } from "../../utils/index.js";
const router = Router();
router.put("/friend-requset/:id", authorizationV2, validation(schema.sendFriendRequest), friendService.sendFriendRequest)
router.delete("/cancel-requset/:id", authorizationV2, validation(schema.cancelFriendRequest), friendService.cancelFriendRequest)
router.delete("/cancel-friend/:id", authorizationV2, validation(schema.cancelFriend), friendService.cancelFriend)
router.put("/confirm-delete", authorizationV2, validation(schema.confiremOrDelete), friendService.confiremOrDelete)
router.get("/get-friends", authorizationV2, validation(schema.getFriends), asyncHandler(friendService.getFriends))
router.get("/getCountRequest", authorizationV2, asyncHandler(friendService.countRequsetFrinds))
router.get("/get-friends-requset", authorizationV2, validation(schema.getRequsetFrinds), asyncHandler(friendService.getRequsetFrinds))
router.get("/search", authorizationV2, validation(schema.searchForFriends), asyncHandler(friendService.searchForFriends))
router.get("/suggestions", authorizationV2, validation(schema.suggestionsFriends), asyncHandler(friendService.suggestionsFriends))
router.get("/mutual-friends/:id", authorizationV2, validation(schema.mutualFriends), asyncHandler(friendService.mutualFriends))
router.delete("/block-user/:id", authorizationV2, validation(schema.blockUser), asyncHandler(friendService.blockUser))
router.delete("/unBlock-user/:id", authorizationV2, validation(schema.unBlockUser), asyncHandler(friendService.unBlockUser))
export default router;