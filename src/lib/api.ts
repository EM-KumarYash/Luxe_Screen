import "server-only";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import type { ApiErrorBody, ApiErrorCode } from "@/types";

import { rateLimit } from "./rate-limit";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(status: number, code: ApiErrorCode, message: string, details?: unknown) {
  const body: ApiErrorBody = { error: { code, message, ...(details === undefined ? {} : { details }) } };
  return Response.json(body, { status });
}

function toErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.code, error.message, error.details);
  }
  if (error instanceof z.ZodError) {
    return errorResponse(400, "VALIDATION_ERROR", "Some fields are invalid.", z.flattenError(error));
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return errorResponse(404, "NOT_FOUND", "The requested record was not found.");
  }
  console.error("[api] Unhandled error", error);
  return errorResponse(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
}

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/**
 * Wraps a route handler with uniform error handling and optional per-IP rate limiting.
 * Every error leaves the API as `{ error: { code, message, details? } }`.
 */
export function apiHandler<C = unknown>(
  handler: Handler<C>,
  options: { rateLimit?: { key: string; limit: number; windowMs: number } } = {},
): Handler<C> {
  return async (request, context) => {
    try {
      if (options.rateLimit) {
        const { key, limit, windowMs } = options.rateLimit;
        const result = rateLimit(`${key}:${clientIp(request)}`, limit, windowMs);
        if (!result.allowed) {
          return Response.json(
            { error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." } } satisfies ApiErrorBody,
            { status: 429, headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } },
          );
        }
      }
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.output<T>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
  return schema.parse(json);
}

export function parseQuery<T extends z.ZodType>(request: Request, schema: T): z.output<T> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return schema.parse(params);
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
