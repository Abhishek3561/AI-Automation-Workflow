import { searchDocsTool } from "./searchDocs";
import { runSqlTool } from "./runSql";
import { httpGetTool } from "./httpGet";
import type { AgentTool } from "./types";

export const allTools: AgentTool[] = [searchDocsTool, runSqlTool, httpGetTool];