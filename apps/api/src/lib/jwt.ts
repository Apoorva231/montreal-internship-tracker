import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type TokenPayload = {
  userId: string;
  email: string;
};

export function signAuthToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

