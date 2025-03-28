import { Router } from "express";
import { authorizationV2, authorizationV3, validation } from "../../middleware/index.js";
import * as schema from "./post.validation.js";
import { asyncHandler } from "../../utils/index.js";
import * as postService from "./post.service.js";
import { fileValid, uploadFile } from "../../utils/multer/multer.cloud.js";
import commentRouter from "../comment/comment.controller.js";
const router = Router();

router.use("/:postId/comment", commentRouter)

router.post("/",
    authorizationV2,
    uploadFile(fileValid.image).array("attachment", 15),
    validation(schema.creatPost), asyncHandler(postService.creatPost))
router.get("/user-posts",
    authorizationV2,
    validation(schema.userPosts),
    asyncHandler(postService.userPosts))
router.get("/user-posts-id/:id",
    authorizationV2,
    validation(schema.userPostsId),
    asyncHandler(postService.userPostsId))

router.get("/details/:postId",
    authorizationV3,
    validation(schema.postDetails),
    asyncHandler(postService.postDetails))

router.put("/update/:postId",
    authorizationV2,
    uploadFile(fileValid.image).array("attachment", 15),
    validation(schema.updatePost),
    asyncHandler(postService.updatePost))

router.delete("/delete/:postId",
    authorizationV2,
    validation(schema.deleteMyPost),
    asyncHandler(postService.deleteMyPost)
)

router.post("/likeUnLike-post/:postId",
    authorizationV2,
    validation(schema.likeUnLike),
    asyncHandler(postService.likeUnLike)
)

router.get("/search",
    authorizationV2,
    validation(schema.searchPost),
    asyncHandler(postService.searchPost)
)

router.get("/forYouPage",
    authorizationV2,
    validation(schema.forYouPosts),
    asyncHandler(postService.forYouPosts)
)

router.patch("/archive/:postId",
    authorizationV2,
    validation(schema.archive),
    asyncHandler(postService.archive)
)
router.patch("/undoArchive/:postId",
    authorizationV2,
    validation(schema.undoArchive),
    asyncHandler(postService.undoArchive)
)

export default router