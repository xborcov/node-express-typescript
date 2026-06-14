import express from "express";

import { createAppointment, getAppointments } from "@/controllers/appointment-controller";
import { verify } from "@/middleware/auth-middleware";

const router = express.Router();

router.get("/", verify, getAppointments);
router.post("/", verify, createAppointment);

export default router;
