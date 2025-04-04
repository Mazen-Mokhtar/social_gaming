import { Router } from "express";
import { authorizationV2, validation } from "../../middleware/index.js"
import * as schema from "./user.validation.js";
import { asyncHandler } from "../../utils/index.js";
import * as userService from "./user.service.js";
import { fileValid, uploadFile } from "../../utils/multer/multer.cloud.js";
const router = Router();
router.get("/profile",
    authorizationV2,
    validation(schema.getProfile), asyncHandler(userService.getProfile))

router.get("/user/:id",
    authorizationV2,
    validation(schema.getUserProfile), asyncHandler(userService.getUserProfile))

router.get("/all-user",
    authorizationV2,
    validation(schema.getAllUser), asyncHandler(userService.getAllUser))

router.get("/get-blocks",
    authorizationV2,
    validation(schema.getBlocks), asyncHandler(userService.getBlocks))

router.get("/search",
    authorizationV2,
    validation(schema.search), asyncHandler(userService.search)
)

router.patch("/update",
    authorizationV2,
    validation(schema.updateProfile), asyncHandler(userService.updateProfile))

router.patch("/updateImage",
    authorizationV2,
    uploadFile(fileValid.image).single("attachment"),
    validation(schema.updateImage), asyncHandler(userService.updateImage))

router.patch("/updateCover",
    authorizationV2,
    uploadFile(fileValid.image).single("attachment"),
    validation(schema.updateCoverImage), asyncHandler(userService.updateCoverImage))

export default router
