import Router from "express";
import * as authService from "./auth.service.js"
import { asyncHandler } from "../../utils/index.js";
import { authorization, authorizationV2, validation } from "../../middleware/index.js";
import * as schema from "./validtion.js";

const router = Router();
router.post("/signup", validation(schema.signup), asyncHandler(authService.signup))
router.get("/reSendSignupCode", authorization, validation(schema.reSendSignupCode), asyncHandler(authService.reSendSignupCode))
router.get("/confirm-email/:authorization", validation(schema.confirmEmail), asyncHandler(authService.confirmEmail))
router.post("/login", validation(schema.login), asyncHandler(authService.login))
router.post("/googleLogin", validation(schema.googleLogin), asyncHandler(authService.googleLogin))
router.post("/forget-password", validation(schema.forgetPassword), asyncHandler(authService.forgetPassword))
router.post("/reset-code", authorization, validation(schema.resetCode), asyncHandler(authService.resetCode));
router.patch("/change-password", authorization, validation(schema.changePassword), asyncHandler(authService.changePassword))
router.delete("/delete", authorization, validation(schema.freezeAccount), asyncHandler(authService.freezeAccount))
router.get("/refresh-token",
    authorizationV2,
    validation(schema.refreshToken),
    asyncHandler(authService.refreshToken))
export default router;