import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const RUN_QUEUE = "workflow-runs";

export const runQueue = new Queue(RUN_QUEUE, { connection: redisConnection });