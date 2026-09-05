import { formatCurrency } from "./apps/web/src/lib/utils";

console.log("Format 1946 with locale 'en':", formatCurrency(1946, "en"));
console.log("Format 1946 with locale 'en-IN':", formatCurrency(1946, "en-IN"));
console.log("Format 1946 with undefined locale:", formatCurrency(1946));
