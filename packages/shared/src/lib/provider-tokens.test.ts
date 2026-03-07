import assert from "node:assert/strict";
import test from "node:test";

import {
  decryptProviderToken,
  encryptProviderToken,
  isEncryptedProviderToken,
} from "./provider-tokens";

test("encryptProviderToken produces decryptable values", () => {
  process.env.OAUTH_TOKEN_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  const encrypted = encryptProviderToken("secret-token");
  assert.ok(encrypted);
  assert.equal(isEncryptedProviderToken(encrypted), true);
  assert.equal(decryptProviderToken(encrypted), "secret-token");
});

test("decryptProviderToken returns plaintext for legacy values during backfill", () => {
  process.env.OAUTH_TOKEN_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  assert.equal(decryptProviderToken("legacy-plaintext"), "legacy-plaintext");
});
