
import { Router } from "express";
import { authorizationV2 } from "../../middleware/authentication.js";
import { validation } from "../../middleware/validation.js";
import * as schema from "./message.validation.js";
import * as messageService from "./message.service.js";
import { asyncHandler } from "../../utils/index.js";
import { fileValid, uploadFile } from "../../utils/multer/multer.cloud.js";

const router = Router();
router.post("/:id",
    authorizationV2,
    uploadFile(fileValid.image).array("attachment", 15),
    validation(schema.sendMessages),
    asyncHandler(messageService.sendMessages))

router.get("/conversations",
    authorizationV2,
    validation(schema.conversations),
    asyncHandler(messageService.conversations))

router.put("/deleteMessage/:id",
    authorizationV2,
    validation(schema.deleteMessage),
    asyncHandler(messageService.deleteMessage))

router.patch("/softDeleteMessage/:id",
    authorizationV2,
    validation(schema.softDeleteMessage),
    asyncHandler(messageService.softDeleteMessage))

router.get("/chat/:id",
    authorizationV2,
    validation(schema.getChat),
    asyncHandler(messageService.getChat))

export default router