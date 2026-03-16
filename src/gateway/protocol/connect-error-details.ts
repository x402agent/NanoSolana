// Stub: connect-error-details
export const ConnectErrorDetailCodes = {
  TOKEN_REQUIRED: "TOKEN_REQUIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  PASSWORD_REQUIRED: "PASSWORD_REQUIRED",
  PASSWORD_INVALID: "PASSWORD_INVALID",
  INCOMPATIBLE: "INCOMPATIBLE",
} as const;

export function readConnectErrorDetailCode(
  _error: unknown,
): string | null {
  return null;
}

export function readConnectErrorRecoveryAdvice(
  _error: unknown,
): string | null {
  return null;
}
