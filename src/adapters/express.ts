import type { Request, Response, NextFunction } from "express";

import type { InMemoryChallengeStore } from "../core/challenge-store.js";
import { verifyAccess } from "../core/access-verifier.js";

export interface NaviAccessExpressOptions {
  keyword: string;
  challengeStore: InMemoryChallengeStore;

  getPublicKey: (request: Request) => string | Promise<string>;

  getBody: (request: Request) => string;
}

export function naviAccess(options: NaviAccessExpressOptions) {
  return async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const challengeId = request.header("X-NaviAccess-Challenge");
      const nonce = request.header("X-NaviAccess-Nonce");
      const representation = request.header("X-NaviAccess-Representation");
      const signature = request.header("X-NaviAccess-Signature");

      if (!challengeId || !nonce || !representation || !signature) {
        response.status(401).json({
          message: "Missing NaviAccess authentication headers.",
        });
        return;
      }

      const publicKey = await options.getPublicKey(request);
      const body = options.getBody(request);

      if (!publicKey) {
        response.status(401).json({
          message: "Client public key not found.",
        });
        return;
      }

      const result = verifyAccess({
        method: request.method,
        path: request.originalUrl,
        body,
        challengeId,
        nonce,
        representation,
        signature,
        publicKey,
        keyword: options.keyword,
        challengeStore: options.challengeStore,
      });

      if (!result.authorized) {
        response.status(401).json({
          message: result.reason,
        });
        return;
      }

      next();
    } catch {
      response.status(500).json({
        message: "NaviAccess verification failed.",
      });
    }
  };
}
