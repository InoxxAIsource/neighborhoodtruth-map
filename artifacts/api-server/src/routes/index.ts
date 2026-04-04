import { Router, type IRouter } from "express";
import healthRouter from "./health";
import labelsRouter from "./labels";
import chatRouter from "./chat";
import seoRouter from "./seo";
import transportRouter from "./transport";
import waitlistRouter from "./waitlist";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/labels", labelsRouter);
router.use("/chat", chatRouter);
router.use("/seo", seoRouter);
router.use("/transport", transportRouter);
router.use("/waitlist", waitlistRouter);

export default router;
