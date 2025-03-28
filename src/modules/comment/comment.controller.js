import { Router } from "express";
import { authorizationV2, validation } from "../../middleware/index.js";
import { fileValid, uploadFile } from "../../utils/multer/multer.cloud.js";
import * as schema from "./comment.validation.js";
import { asyncHandler } from "../../utils/index.js";
import * as commentService from "./comment.service.js";
const router = Router({ mergeParams: true });
// "/post/:postId?/comment"
router.post("/:id?",
    authorizationV2,
    uploadFile(fileValid.image).single("attachment"),
    validation(schema.addComment),
    asyncHandler(commentService.addComment)
)

router.put("/update/:id",
    authorizationV2,
    validation(schema.updateComment),
    asyncHandler(commentService.updateComment))

router.delete("/delete/:id",
    authorizationV2,
    validation(schema.deleteComment),
    asyncHandler(commentService.deleteComment))

router.get("/replies/:id",
    authorizationV2,
    validation(schema.getReplies),
    asyncHandler(commentService.getReplies))

router.get("/",
    authorizationV2,
    validation(schema.getComment),
    asyncHandler(commentService.getComment))

router.patch("/likeUnlike/:id",
    authorizationV2,
    validation(schema.likeUnLike),
    asyncHandler(commentService.likeUnLike))
export default router