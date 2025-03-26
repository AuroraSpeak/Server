import { cookies, headers } from "next/headers";
import { verifyCsrfToken } from "./csrf-wrapper";

export async function validateCsrfOrThrow() {
  const csrfSecret = (await cookies()).get("csrfSecret")?.value;
  const csrfToken = (await headers()).get("x-csrf-token");

  if (!csrfSecret || !csrfToken || !verifyCsrfToken(csrfSecret, csrfToken)) {
    throw new Error("Invalid CSRF token");
  }
}
