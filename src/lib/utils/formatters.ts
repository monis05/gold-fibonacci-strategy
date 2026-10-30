export function formatPrice(price: number, decimals: number = 2): string {
  if (isNaN(price)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price);
}

export function formatCurrency(amount: number, decimals: number = 2): string {
  if (isNaN(amount)) return "—";
  const sign = amount >= 0 ? "+" : "";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount));

  return amount >= 0 ? `${sign}${formatted}` : `-${formatted}`;
}

export function formatPercent(value: number, decimals: number = 2): string {
  if (isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatTime(timestampSeconds: number): string {
  const d = new Date(timestampSeconds * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatDateTime(timestampSeconds: number): string {
  const d = new Date(timestampSeconds * 1000);
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins % 60}m`;
  }
  return `${mins}m ${seconds % 60}s`;
}
