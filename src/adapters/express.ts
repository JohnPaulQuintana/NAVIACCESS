
import type { Request, Response, NextFunction } from "express";

import type { ChallengeStore } from "../core/challenge-store.js";
import { verifyAccess } from "../core/access-verifier.js";

export interface NaviAccessExpressOptions {
  keyword: string;
  challengeStore: ChallengeStore;

  /**
   * Resolves the trusted public key for the requesting client.
   * Never retrieve this key from an untrusted request header or body.
   */
  getPublicKey: (request: Request) => string | Promise<string>;

  /**
   * Extracts the exact body string used by the client when signing.
   * Prefer the raw HTTP request body over JSON.stringify(request.body).
   */
  getBody: (request: Request) => string;
}

/**
 * Express middleware for NaviAccess request verification.
 */
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

      if (!publicKey) {
        response.status(401).json({
          message: "Client public key not found.",
        });
        return;
      }

      const body = options.getBody(request);

      if (typeof body !== "string") {
        response.status(400).json({
          message: "Unable to retrieve the original request body.",
        });
        return;
      }

      const result = await verifyAccess({
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
