function capitalize(value: string) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatPlanName(teamTier?: string | null) {
  switch (teamTier) {
    case "free":
    case undefined:
    case null:
      return "Solo Plan";
    case "starter":
      return "Starter Plan";
    case "studio":
      return "Studio Plan";
    case "agency":
      return "Agency Plan";
    default:
      return `${capitalize(teamTier)} Plan`;
  }
}

export function getPlanStatusLabel(subscriptionCancelAt?: string | null) {
  return subscriptionCancelAt ? "Canceling" : null;
}
