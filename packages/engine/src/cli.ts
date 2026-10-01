import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { catalog } from "./catalog-data";
import { recommend } from "./recommend";
import { breakEven, sensitivity } from "./sensitivity";
import { validateCatalog, validateProfile } from "./validate";
import type { ProfileInput } from "./types";

const root = resolve(import.meta.dirname, "../../..");

function readStdin(): Promise<string> {
  return new Promise((resolveText, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolveText(data));
    process.stdin.on("error", reject);
  });
}

const command = process.argv[2] ?? "health";

if (command === "health") {
  console.log(JSON.stringify({ ok: true, calculationVersion: catalog.calculationVersion, catalogVersion: catalog.catalogVersion }));
} else if (command === "emit-catalog") {
  const target = resolve(root, "data/catalog/catalog.json");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(catalog, null, 2));
  console.log(target);
} else if (command === "cards") {
  console.log(
    JSON.stringify({
      calculationVersion: catalog.calculationVersion,
      catalogVersion: catalog.catalogVersion,
      cards: catalog.cards.map((card) => ({
        id: card.id,
        name: card.name,
        rankEligible: card.rankEligible,
        productUrl: card.productUrl,
      })),
    }),
  );
} else if (command === "card") {
  const card = catalog.cards.find((item) => item.id === process.argv[3]);
  if (!card) process.exit(1);
  console.log(JSON.stringify(card, null, 2));
} else if (command === "recommend" || command === "scenarios") {
  const input = JSON.parse(await readStdin()) as ProfileInput & { cardIds?: string[]; scales?: number[]; cardAId?: string; cardBId?: string };
  const errors = validateProfile(input);
  if (errors.length) {
    console.error(JSON.stringify({ errors }));
    process.exit(1);
  }
  if (command === "recommend") console.log(JSON.stringify(recommend(catalog, input)));
  else if (input.cardAId && input.cardBId) console.log(JSON.stringify(breakEven(catalog, input, input.cardAId, input.cardBId)));
  else console.log(JSON.stringify(sensitivity(catalog, input, input.cardIds ?? [], input.scales ?? [0.5, 1, 1.5, 2])));
} else if (command === "validate") {
  const errors = validateCatalog(catalog);
  console.log(JSON.stringify({ ok: errors.length === 0, errors }));
  if (errors.length) process.exit(1);
} else {
  process.exit(1);
}
