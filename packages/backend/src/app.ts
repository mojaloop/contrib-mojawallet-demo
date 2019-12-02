import { KnexAccountService } from "./services/accounts-service";
import { Logger } from "pino";
import { KnexTransactionService } from "./services/transactions-service";
import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import {
  create as createTransaction,
  index as indexTransactions
} from "./controllers/transactions";
import {
  create as createAccount,
  update as updateAccount,
  show as showAccount,
  index as indexAccount
} from "./controllers/accounts";
import { AccountsAppContext } from "./index";
import cors from "@koa/cors";

export type AppConfig = {
  logger: Logger;
  accountsService: KnexAccountService;
  transactionsService: KnexTransactionService;
};

export function createApp(appConfig: AppConfig): Koa<any, AccountsAppContext> {
  const app = new Koa<any, AccountsAppContext>();
  const privateRouter = new Router<any, AccountsAppContext>();
  const publicRouter = new Router<any, AccountsAppContext>();

  app.use(cors());
  app.use(bodyParser());
  app.use(async (ctx, next) => {
    ctx.accounts = appConfig.accountsService;
    ctx.transactions = appConfig.transactionsService;
    ctx.logger = appConfig.logger;
    await next();
  });

  // Health Endpoint
  publicRouter.get("/", ctx => {
    ctx.status = 200;
  });

  privateRouter.get("/accounts/:id", showAccount);
  privateRouter.get("/accounts", indexAccount);
  privateRouter.post("/accounts", createAccount);
  privateRouter.patch("/accounts/:id", updateAccount);
  privateRouter.delete("/accounts/:id", createAccount);

  privateRouter.get("/transactions", indexTransactions);
  privateRouter.post("/transactions", createTransaction);

  app.use(publicRouter.routes());
  app.use(privateRouter.routes());

  return app;
}
