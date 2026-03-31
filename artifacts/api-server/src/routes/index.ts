import { Router, type IRouter } from "express";
import healthRouter from "./health";
import labelsRouter from "./labels";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/labels", labelsRouter);
router.use("/chat", chatRouter);

export default router;
