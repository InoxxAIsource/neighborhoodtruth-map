import { Router, type IRouter } from "express";
import healthRouter from "./health";
import labelsRouter from "./labels";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/labels", labelsRouter);

export default router;
