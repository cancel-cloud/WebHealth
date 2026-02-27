import assert from "node:assert/strict";
import test from "node:test";

import {
  aiSeoReportJsonSchemaForOpenAI,
  buildOpenAiStrictJsonSchema,
  aiSeoReportJsonSchema,
} from "@/lib/reports/ai-report-schema";

type JsonSchema = Record<string, unknown>;

function walk(node: unknown, visitor: (node: JsonSchema, path: string) => void, path = "$") {
  if (!node || typeof node !== "object") return;
  const schema = node as JsonSchema;

  visitor(schema, path);

  if (schema.type === "object" && schema.properties && typeof schema.properties === "object") {
    const properties = schema.properties as Record<string, unknown>;
    for (const [key, child] of Object.entries(properties)) {
      walk(child, visitor, `${path}.properties.${key}`);
    }
  }

  if (schema.type === "array" && schema.items) {
    walk(schema.items, visitor, `${path}.items`);
  }

  if (Array.isArray(schema.anyOf)) {
    schema.anyOf.forEach((child, idx) => walk(child, visitor, `${path}.anyOf[${idx}]`));
  }

  if (Array.isArray(schema.oneOf)) {
    schema.oneOf.forEach((child, idx) => walk(child, visitor, `${path}.oneOf[${idx}]`));
  }
}

test("openai strict schema requires all object keys and forbids additional properties", () => {
  walk(aiSeoReportJsonSchemaForOpenAI, (node, path) => {
    assert.equal(
      Object.prototype.hasOwnProperty.call(node, "propertyNames"),
      false,
      `propertyNames must not be present at ${path} for OpenAI strict compatibility`
    );

    if (node.type !== "object") return;
    const properties = node.properties as Record<string, unknown> | undefined;
    if (!properties) return;

    const keys = Object.keys(properties).sort();
    const required = Array.isArray(node.required) ? (node.required as string[]).slice().sort() : [];

    assert.deepEqual(
      required,
      keys,
      `required keys mismatch at ${path}; required=${JSON.stringify(required)} keys=${JSON.stringify(keys)}`
    );
    assert.equal(node.additionalProperties, false, `additionalProperties must be false at ${path}`);
  });
});

test("strict schema builder is deterministic", () => {
  const built = buildOpenAiStrictJsonSchema(aiSeoReportJsonSchema);
  assert.deepEqual(built, aiSeoReportJsonSchemaForOpenAI);
});
