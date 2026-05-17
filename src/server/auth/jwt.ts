import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);

export type JwtPayload = {
  sub: string; // userId
  email: string;
  role: string;
  companyId: string;
  employeeId?: string;
};

export async function signJwt(payload: JwtPayload) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES || "7d")
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
