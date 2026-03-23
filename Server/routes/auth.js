import express from "express";
import { login, logout, refreshToken, register } from '../controllers/auth/auth.js';
import authenticateUser from "../middleware/authentication.js";

const router = express.Router();

router.post( "/refresh-token", refreshToken );
router.post( "/logout", authenticateUser, logout );
router.post( "/register", register );
router.post( "/login", login );

export default router;