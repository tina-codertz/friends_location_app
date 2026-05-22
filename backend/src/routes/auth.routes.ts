import { Hono } from "hono";
import { register, login, checkUsername } from "../controllers/auth.controller";

const auth = new Hono();

auth.get("/check-username", checkUsername);
auth.post("/register", register);
auth.post("/login", login);

export default auth;
