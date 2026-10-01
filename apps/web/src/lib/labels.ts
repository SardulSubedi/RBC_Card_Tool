import type { Category } from "@cardfit/engine";

export const labels: Record<Category, string> = {
  groceries: "Groceries",
  warehouse: "Costco and Walmart",
  dining: "Dining and takeout",
  gas: "Gas",
  ev_charging: "EV charging",
  transit: "Transit",
  rideshare: "Rideshare",
  streaming: "Streaming",
  gaming: "Digital gaming",
  bills: "Other bills",
  travel: "Travel",
  other: "Everything else",
};

export const familyLabels = {
  cash_back: "Cash back",
  everyday: "Everyday rewards",
  travel: "Travel rewards",
  low_interest: "Low interest",
} as const;
