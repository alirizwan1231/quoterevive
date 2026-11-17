// Paste suite — Smart Paste parser in app/paste.ts (no-CSV-needed import).
// Runs against the compiled paste.js, same as the other suites run
// against the compiled lib.js / cloud.js. Pure client-side parsing:
// Excel/Sheets blocks, comma lines and free-form lines, with honest
// per-line problems instead of silent drops.
export default function suite(paste, h) {
  const { parsePastedQuotes } = paste;

  h.area("Excel TSV paste with header");
  const tsvHeader = [
    "Name\tEmail\tAmount\tQuote Date\tJob Type",
    "James Miller\tjames.miller@example.com\t8400\t2026-08-14\tKitchen remodel",
    "Sarah Thompson\tsarah.t@example.com\t$3,200\t2026-08-28\tBathroom tiling",
  ].join("\n");
  const r1 = parsePastedQuotes(tsvHeader);
  h.eq(r1.rows.length, 2, "both data rows parsed");
  h.eq(r1.problems.length, 0, "no problems");
  h.eq(r1.rows[0].name, "James Miller", "row 1 name");
  h.eq(r1.rows[0].email, "james.miller@example.com", "row 1 email");
  h.eq(r1.rows[0].amount, 8400, "row 1 amount");
  h.eq(r1.rows[0].jobType, "Kitchen remodel", "row 1 job type");
  h.eq(r1.rows[0].date, "2026-08-14", "row 1 date");
  h.eq(r1.rows[1].amount, 3200, "row 2 amount strips $ and comma");

  h.area("TSV without header");
  const r2 = parsePastedQuotes("David Garcia\tdavid.garcia@example.com\t12500\t2026-09-03\tRoof replacement");
  h.eq(r2.rows.length, 1, "one row parsed");
  h.eq(r2.problems.length, 0, "no problems");
  h.eq(r2.rows[0].name, "David Garcia", "name from first cell");
  h.eq(r2.rows[0].email, "david.garcia@example.com", "email found");
  h.eq(r2.rows[0].amount, 12500, "amount found");
  h.eq(r2.rows[0].jobType, "Roof replacement", "job type from last cell");
  h.eq(r2.rows[0].date, "2026-09-03", "date found");

  h.area("Comma lines");
  const r3 = parsePastedQuotes(
    "Emily Wilson, emily.w@example.com, 1850, 2026-09-11, Exterior painting\n" +
    "Michael Brown, mbrown@example.com, 5600, AC replacement"
  );
  h.eq(r3.rows.length, 2, "both comma lines parsed");
  h.eq(r3.problems.length, 0, "no problems");
  h.eq(r3.rows[0].name, "Emily Wilson", "line 1 name");
  h.eq(r3.rows[0].amount, 1850, "line 1 amount");
  h.eq(r3.rows[0].date, "2026-09-11", "line 1 date");
  h.eq(r3.rows[0].jobType, "Exterior painting", "line 1 job type");
  h.eq(r3.rows[1].jobType, "AC replacement", "line 2 job type without date");

  h.area("CSV-with-header pasted as text");
  const r4 = parsePastedQuotes(
    "name,email,amount,quote date,job type\n" +
    "James Miller,james.miller@example.com,8400,2026-08-14,Kitchen remodel"
  );
  h.eq(r4.rows.length, 1, "one row parsed");
  h.eq(r4.problems.length, 0, "no problems");
  h.eq(r4.rows[0].amount, 8400, "amount via header columns");
  h.eq(r4.rows[0].jobType, "Kitchen remodel", "job type via header columns");

  h.area("Free-form dash lines");
  const r5 = parsePastedQuotes(
    "Ahmed Khan — ahmed@mail.com — Kitchen remodel — 5000\n" +
    "John Smith  john@mail.com  $8,400 Roof"
  );
  h.eq(r5.rows.length, 2, "both free-form lines parsed");
  h.eq(r5.problems.length, 0, "no problems");
  h.eq(r5.rows[0].name, "Ahmed Khan", "dash line name");
  h.eq(r5.rows[0].email, "ahmed@mail.com", "dash line email");
  h.eq(r5.rows[0].amount, 5000, "dash line amount");
  h.eq(r5.rows[0].jobType, "Kitchen remodel", "dash line job type");
  h.eq(r5.rows[1].name, "John Smith", "space line name");
  h.eq(r5.rows[1].amount, 8400, "space line $ amount");
  h.eq(r5.rows[1].jobType, "Roof", "space line job type");

  h.area("$ and comma amounts");
  const r6 = parsePastedQuotes("Laura Hall laura.hall@example.com $15,200.50 Full home renovation");
  h.eq(r6.rows.length, 1, "one row parsed");
  h.eq(r6.rows[0].amount, 15200.5, "amount keeps cents, drops $ and commas");

  h.area("Date detection");
  const r7 = parsePastedQuotes(
    "Kevin Young, kevin.young@example.com, 6100, 09/03/2026, Heating install\n" +
    "Rachel King rachel.king@example.com 7200 2026-11-04 Garage conversion"
  );
  h.eq(r7.rows.length, 2, "both rows parsed");
  h.eq(r7.rows[0].date, "2026-09-03", "MM/DD/YYYY normalised to ISO");
  h.eq(r7.rows[1].date, "2026-11-04", "ISO date kept as-is");
  h.eq(r7.rows[0].amount, 6100, "date numbers not read as the amount");

  h.area("Missing email is a problem, not a drop");
  const r8 = parsePastedQuotes("Mary Jones, 3200, Bathroom");
  h.eq(r8.rows.length, 0, "no row without an email");
  h.eq(r8.problems.length, 1, "one problem reported");
  h.includes(r8.problems[0].reason, "email", "reason names the missing email");
  h.eq(r8.problems[0].line, 1, "problem carries the line number");

  h.area("Missing amount is a problem, not a drop");
  const r9 = parsePastedQuotes("Chris Walker chris.w@example.com Full home renovation");
  h.eq(r9.rows.length, 0, "no row without an amount");
  h.eq(r9.problems.length, 1, "one problem reported");
  h.includes(r9.problems[0].reason, "amount", "reason names the missing amount");

  h.area("Mixed good and bad lines");
  const r10 = parsePastedQuotes(
    "Amanda Lee, amanda.lee@example.com, 2600, Interior painting\n" +
    "No Email Here, 999, Fence repair\n" +
    "Bad Amount bad.amount@example.com, Deck build"
  );
  h.eq(r10.rows.length, 1, "only the good line becomes a row");
  h.eq(r10.problems.length, 2, "both bad lines reported");
  h.eq(r10.problems[0].line, 2, "first problem on line 2");
  h.eq(r10.problems[1].line, 3, "second problem on line 3");

  h.area("Header-only input");
  const r11 = parsePastedQuotes("Name\tEmail\tAmount\tJob Type");
  h.eq(r11.rows.length, 0, "no rows");
  h.eq(r11.problems.length, 0, "header alone is not an error");
  const r12 = parsePastedQuotes("name,email,amount,job type");
  h.eq(r12.rows.length, 0, "comma header alone: no rows");
  h.eq(r12.problems.length, 0, "comma header alone: no problems");

  h.area("Empty input");
  const r13 = parsePastedQuotes("");
  h.eq(r13.rows.length, 0, "empty string: no rows");
  h.eq(r13.problems.length, 0, "empty string: no problems");
  const r14 = parsePastedQuotes("   \n \n  ");
  h.eq(r14.rows.length, 0, "whitespace only: no rows");
  h.eq(r14.problems.length, 0, "whitespace only: no problems");
}
