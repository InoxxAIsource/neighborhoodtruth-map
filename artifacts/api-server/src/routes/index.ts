import { Router, type IRouter } from "express";
import healthRouter from "./health";
import labelsRouter from "./labels";
import chatRouter from "./chat";
import seoRouter from "./seo";
import transportRouter from "./transport";
import waitlistRouter from "./waitlist";
import poiRouter from "./poi";
import festivalsRouter from "./festivals";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/labels", labelsRouter);
router.use("/chat", chatRouter);
router.use("/seo", seoRouter);
router.use("/transport", transportRouter);
router.use("/waitlist", waitlistRouter);
router.use("/poi", poiRouter);
router.use("/festivals", festivalsRouter);

export default router;
