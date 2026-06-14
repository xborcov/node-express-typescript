import express from "express";

import { createUser, errorUser, getUsers } from "@/controllers/user-controller";
import { verify } from "@/middleware/auth-middleware";

const router = express.Router();

router.get("/", verify, getUsers);
router.post("/", verify, createUser);
router.get("/error", errorUser);

export default router;
