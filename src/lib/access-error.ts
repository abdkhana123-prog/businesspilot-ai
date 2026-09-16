export function getFriendlyAccessError(
  errorMessage: string,
  moduleName: string,
) {
  const message = errorMessage.toLowerCase();

  if (
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("rls") ||
    message.includes("not allowed")
  ) {
    return `Your role does not include access to ${moduleName}. Please contact your workspace Owner.`;
  }

  return errorMessage;
}
