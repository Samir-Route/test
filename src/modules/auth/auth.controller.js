import { Router } from "express";
import * as authService from "./auth.service.js";

const authRouter = Router();

authRouter.post("/signup", authService.signUp);
authRouter.post("/login", authService.login);
authRouter.get("/verify", authService.verifyEmail);
authRouter.get("/refresh", authService.refreshToken);
authRouter.post("/forget", authService.forgotPassword);
authRouter.post("/reset", authService.resetPassword);


export default authRouter;