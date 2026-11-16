// Tiny assertion harness shared by the QuoteRevive test suites.
// Suites register named areas; every check is counted per area.
import assert from "node:assert";

export function createHarness(suiteName) {
  const areas = new Map(); // name -> {pass, fail, failures[]}
  let current = null;

  function record(okFlag, label, detail) {
    if (!current) throw new Error("check() called before area()");
    const a = areas.get(current);
    if (okFlag) a.pass++;
    else {
      a.fail++;
      a.failures.push(detail ? `${label} — ${detail}` : label);
    }
  }

  const api = {
    area(name) {
      current = name;
      if (!areas.has(name)) areas.set(name, { pass: 0, fail: 0, failures: [] });
    },
    eq(actual, expected, label) {
      record(Object.is(actual, expected) || actual === expected, label,
        `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    deepEq(actual, expected, label) {
      try {
        assert.deepStrictEqual(actual, expected);
        record(true, label);
      } catch (e) {
        record(false, label, String(e.message).split("\n")[0]);
      }
    },
    ok(cond, label) {
      record(!!cond, label, "condition was false");
    },
    includes(haystack, needle, label) {
      record(typeof haystack === "string" && haystack.includes(needle), label,
        `expected ${JSON.stringify(haystack)} to include ${JSON.stringify(needle)}`);
    },
    report() {
      let pass = 0, fail = 0;
      console.log(`\n=== ${suiteName} ===`);
      for (const [name, a] of areas) {
        pass += a.pass; fail += a.fail;
        console.log(`  ${a.fail === 0 ? "PASS" : "FAIL"}  ${name}: ${a.pass}/${a.pass + a.fail}`);
        for (const f of a.failures) console.log(`       ✗ ${f}`);
      }
      console.log(`  TOTAL ${suiteName}: ${pass}/${pass + fail}`);
      return { pass, fail };
    },
  };
  return api;
}
