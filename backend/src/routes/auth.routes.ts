import { Hono } from "hono";
import {
  register,
  verifyOTP,
  login,
} from "../controllers/auth.controller";

const auth = new Hono();

auth.post("/register", register);
auth.post("/verify-otp", verifyOTP);
auth.post("/login", login);

export default auth;