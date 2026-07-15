import { readFileSync, writeFileSync } from "node:fs";
import { getTableConfig } from "drizzle-orm/pg-core";
import { getTableName } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
// Tables in display order
const TABLES = [
    schema.products,
    schema.customers,
    schema.paymentMethods,
    schema.orders,
    schema.orderItems,
    schema.transactions,
];
const SQL_TYPE_MAP = {
    serial: "serial",
    integer: "integer",
    text: "text",
    timestamp: "timestamp",
};
function sqlTypeToShort(sqlType) {
    if (sqlType.startsWith("varchar"))
        return "varchar";
    return SQL_TYPE_MAP[sqlType] ?? sqlType;
}
function generateMermaid() {
    const lines = ["```mermaid", "erDiagram"];
    // Collect FK relationships
    const relationships = [];
    for (const table of TABLES) {
        const { name, columns, foreignKeys } = getTableConfig(table);
        lines.push(`    ${name} {`);
        for (const col of columns) {
            const type = sqlTypeToShort(col.getSQLType());
            const tags = [];
            if (col.primary)
                tags.push("PK");
            if (col.isUnique)
                tags.push("UK");
            const isFk = foreignKeys.some((fk) => {
                const ref = fk.reference();
                return ref.columns.some((c) => c.name === col.name);
            });
            if (isFk)
                tags.push("FK");
            const tagStr = tags.length ? ` ${tags.join(",")}` : "";
            lines.push(`        ${type} ${col.name}${tagStr}`);
        }
        lines.push("    }");
        lines.push("");
        for (const fk of foreignKeys) {
            const ref = fk.reference();
            const refTableName = getTableName(ref.foreignColumns[0].table);
            const col = ref.columns[0];
            const verb = getRelationVerb(name, refTableName);
            const cardinality = col.notNull ? "||--o{" : "|o--o{";
            relationships.push(`    ${refTableName} ${cardinality} ${name} : "${verb}"`);
        }
    }
    lines.push(...relationships);
    lines.push("```");
    return lines.join("\n");
}
function getRelationVerb(from, to) {
    const verbs = {
        orders: { customers: "has" },
        order_items: { orders: "contains", products: "references" },
        transactions: { orders: "generates", payment_methods: "uses" },
    };
    return verbs[from]?.[to] ?? "relates to";
}
const MARKERS = {
    html: { start: "<!-- ER_START -->", end: "<!-- ER_END -->" },
    jsx: { start: "{/* ER_START */}", end: "{/* ER_END */}" },
};
function detectMarkerStyle(content) {
    for (const [key, { start, end }] of Object.entries(MARKERS)) {
        if (content.includes(start) && content.includes(end))
            return key;
    }
    return null;
}
function injectIntoFile(filePath, mermaid) {
    const content = readFileSync(filePath, "utf-8");
    const style = detectMarkerStyle(content);
    if (!style) {
        console.warn(`Markers not found in ${filePath}, skipping`);
        return;
    }
    const { start: startMarker, end: endMarker } = MARKERS[style];
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    const before = content.slice(0, startIdx + startMarker.length);
    const after = content.slice(endIdx);
    const updated = `${before}\n\n${mermaid}\n\n${after}`;
    writeFileSync(filePath, updated);
    console.log(`Updated ${filePath}`);
}
const mermaid = generateMermaid();
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../../..");
injectIntoFile(resolve(root, "README.md"), mermaid);
injectIntoFile(resolve(root, "README.ptBR.md"), mermaid);
injectIntoFile(resolve(root, "apps/docs/content/docs/database.mdx"), mermaid);
