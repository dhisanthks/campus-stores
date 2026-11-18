(() => {
  const storageKey = "campus-stores.shift.v4";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);

  /* ------------------------------------------------------------------ */
  /* Sample records                                                      */
  /* ------------------------------------------------------------------ */
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      pickup: "Fri 4 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
      // People the filer has named to collect, and where the desk saw it.
      delegates: [
        {
          name: "Kabir Sen",
          source: "Named by Isha Rao in the Desk book, Fri 3:20 pm",
        },
      ],
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      pickup: "Fri 3 pm",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
      delegates: [],
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      pickup: "Sat 10 am",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
      delegates: [],
    },
    {
      id: "RQ-219",
      club: "Drama Club",
      event: "Rehearsal run-through",
      owner: "Nikhil Rao",
      due: "Sat 5 pm",
      pickup: "Sat 11 am",
      items: ["HDMI projector", "USB-C → HDMI adapter"],
      note: "Projecting set designs in the seminar hall from a USB-C laptop.",
      delegates: [],
    },
  ];
  const baseAssets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "A3",
      repair: "Lamp fault · in the workshop since before this shift",
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  // Staff can add units and type collector names, so both lists grow with the shift.
  const assets = [];
  const people = [];
  const syncLists = () => {
    assets.splice(0, assets.length, ...baseAssets, ...s.added);
    people.splice(0, people.length, ...basePeople, ...s.extraPeople);
  };
  const basePeople = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
    "Nikhil Rao",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      at: 945,
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      at: 1170,
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      at: 1980,
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const deskMessages = [
    {
      at: 920,
      author: "Isha Rao · Film Society",
      ref: "RQ-214",
      text: "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
    },
    {
      at: 930,
      author: "Tara Shah · Debate Union",
      ref: "L-401",
      text: "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
    },
    {
      at: 1170,
      author: "Kabir Sen · Film Society",
      ref: "RQ-214",
      text: "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
    },
  ];
  const pages = [
    ["Today", "house"],
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  // What leaves the desk with each unit, checked off again at return.
  const accessories = {
    "HDMI projector": ["Power cable", "HDMI cable", "Remote"],
    "Portable speaker": ["Power cable", "Aux cable"],
    "Wireless microphone": ["Receiver", "AA batteries"],
    "Digital camera": ["Battery", "Charger", "SD card"],
  };
  // Desk staff who can sign in to a shift.
  const staffList = ["Rohan Iyer", "Meera Pillai", "Sam Joseph"];
  // The sample weekend runs Friday to Sunday; any time in it can be entered.
  const days = ["Fri", "Sat", "Sun"];
  const longDays = ["Friday", "Saturday", "Sunday"];
  const maxAt = days.length * 1440;

  /* ------------------------------------------------------------------ */
  /* Time: minutes from Friday 00:00, so due times and the clock compare */
  /* ------------------------------------------------------------------ */
  const dueAt = (due) => {
    const m = /^(Fri|Sat|Sun) (?:(\d+)(?::(\d\d))? (am|pm)|noon)$/.exec(due || "");
    if (!m || (m[2] && (+m[2] < 1 || +m[2] > 12 || +(m[3] || 0) > 59)))
      return Infinity;
    const day = days.indexOf(m[1]) * 1440;
    if (!m[2]) return day + 720;
    return (
      day +
      ((Number(m[2]) % 12) + (m[4] === "pm" ? 12 : 0)) * 60 +
      Number(m[3] || 0)
    );
  };
  const fmt = (at, long = false) => {
    const i = Math.min(Math.floor(at / 1440), days.length - 1);
    const day = long ? longDays[i] : days[i];
    const m = at % 1440,
      h = Math.floor(m / 60),
      mm = m % 60;
    const clock =
      h === 12 && !mm
        ? "noon"
        : (h % 12 || 12) +
          (mm ? ":" + String(mm).padStart(2, "0") : long ? ":00" : "") +
          (h >= 12 ? " pm" : " am");
    return day + (long ? " · " : " ") + clock;
  };

  // A day picker plus a free time box, converted to and from desk minutes.
  const toParts = (at) =>
    Number.isFinite(at)
      ? {
          day: days[Math.floor(at / 1440)] || "",
          time:
            String(Math.floor((at % 1440) / 60)).padStart(2, "0") +
            ":" +
            String(at % 60).padStart(2, "0"),
        }
      : { day: "", time: "" };
  const fromParts = (day, time) => {
    const i = days.indexOf(day);
    const m = /^(\d{2}):(\d{2})$/.exec(time || "");
    if (i < 0 || !m || +m[1] > 23 || +m[2] > 59) return null;
    return i * 1440 + +m[1] * 60 + +m[2];
  };

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  const ui = () => ({
    editing: false,
    adding: false,
    draft: null,
    returning: "",
    stillOut: 0,
    history: 0,
    check: false,
    confirmRestart: false,
    lastReq: "",
    shortcuts: false,
    focus: "",
  });
  const original = () => ({
    version: 4,
    tab: "Today",
    phase: 0,
    selected: "",
    filter: "All items",
    search: "",
    onlyOpen: true,
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
        issuedAt: 900,
        log: [{ at: 900, text: "Issued to Tara Shah, return by Sat 10 am." }],
      },
    ],
    staff: "",
    notes: [],
    repairs: {},
    fixed: [],
    added: [],
    extraPeople: [],
    undo: null,
    notice: "Sample shift · All records are fictional.",
    tone: "",
    ...ui(),
  });
  let s = original();
  syncLists();

  /* ------------------------------------------------------------------ */
  /* Derived facts                                                       */
  /* ------------------------------------------------------------------ */
  const now = () => shifts[s.phase].at;
  const getAsset = (id) => assets.find((x) => x.id === id);
  const partsOf = (id) => accessories[getAsset(id).type] || [];
  const entry = (text) => ({ at: now(), text, by: s.staff });
  const getReq = (id) => requests.find((x) => x.id === id);
  const getLoan = (num) => s.loans.find((l) => l.num === Number(num));
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const openLoans = () => s.loans.filter((l) => !l.back);
  const inRepair = (id) =>
    !!(
      (getAsset(id).repair && !s.fixed.includes(id)) ||
      Object.hasOwn(s.repairs, id)
    );
  const repairNote = (id) => s.repairs[id] || getAsset(id).repair;
  const homeBin = (id) => getAsset(id).bin;
  const types = () => [...new Set(assets.map((a) => a.type))];
  const prefixOf = (type) => {
    const a = assets.find((x) => x.type === type);
    return a ? a.id.slice(0, 2) : "";
  };
  const nextCode = (prefix) => {
    if (!/^[A-Z]{2}$/.test(prefix)) return "";
    let n = 1;
    for (const a of assets)
      if (a.id.startsWith(prefix + "-")) n = Math.max(n, Number(a.id.slice(3)) + 1);
    return n > 99 ? "" : prefix + "-" + String(n).padStart(2, "0");
  };
  // Tidy a typed name and match it to a known person regardless of case.
  const canonName = (raw) => {
    const t = String(raw || "").trim().replace(/\s+/g, " ").slice(0, 60);
    return (
      people.find((p) => p.toLowerCase() === t.toLowerCase()) ||
      t.replace(/(^|[\s-])(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase())
    );
  };
  const nameOk = (n) => /^[\p{L}][\p{L} .'’-]{1,59}$/u.test(n);
  const remember = (n) => {
    if (!people.includes(n)) {
      s.extraPeople.push(n);
      syncLists();
    }
  };
  const unitStatus = (id) =>
    inRepair(id) ? "In repair" : out(id) ? "On loan" : "On shelf";
  const available = (type) =>
    assets.filter((a) => a.type === type && !inRepair(a.id) && !out(a.id));
  const overdue = (l) => !l.back && dueAt(l.due) < now();
  const expectedLate = (l) =>
    !l.back && !!l.expected && dueAt(l.expected) < now();
  const unitLabel = (id) => id + " · " + getAsset(id).type;
  const loansFor = (id) => s.loans.filter((l) => l.req === id);
  const lineState = (r) =>
    r.items.map((type) => {
      const ls = loansFor(r.id).filter(
        (l) => getAsset(l.asset).type === type,
      );
      return {
        type,
        open: ls.find((l) => !l.back) || null,
        done: ls.find((l) => l.back) || null,
      };
    });
  const lapsed = (r) => dueAt(r.due) <= now();
  const authority = (r, who) =>
    who === r.owner
      ? "Filed the request"
      : (r.delegates.find((d) => d.name === who) || {}).source || "";
  const collectors = (r) => [r.owner, ...r.delegates.map((d) => d.name)];
  const heldBy = (l) =>
    l.withWho
      ? "With " +
        l.withWho +
        (l.expected ? " · expected " + l.expected : "") +
        (l.handoverNote ? " · “" + l.handoverNote + "”" : "")
      : "";
  function reqStatus(r) {
    const lines = lineState(r);
    const issued = lines.filter((x) => x.open || x.done);
    const open = lines.filter((x) => x.open);
    const late = open.some((x) => overdue(x.open));
    const missing = lines.length - issued.length;
    if (!issued.length)
      return lapsed(r)
        ? ["Approval lapsed", "warn"]
        : now() > dueAt(r.pickup)
          ? ["Not collected", "warn"]
          : ["Awaiting pickup", ""];
    if (!open.length)
      return missing
        ? ["Returned · kit left incomplete", "warn"]
        : ["Returned", "good"];
    if (open.length < issued.length)
      return [
        "Partly returned · " +
          (issued.length - open.length) +
          " of " +
          issued.length +
          " back",
        late ? "warn" : "",
      ];
    if (missing)
      return [
        "Out · " + missing + " item" + (missing > 1 ? "s" : "") + " not issued",
        "warn",
      ];
    return [late ? "Out · overdue" : "Out", late ? "warn" : ""];
  }
  // Everything the person at the counter should act on right now.
  function attention() {
    const list = [];
    if (!s.staff)
      list.push({
        level: "todo",
        title: "Sign in to start your shift",
        sub: "Every slip, return and note records who on the desk made it.",
        actions: [["Sign in", "gosignin", ""]],
      });
    for (const x of bookingRisks())
      list.push({
        level: "warn",
        title: "Booking at risk · " + x.r.club + " · " + x.r.pickup,
        sub: "Needs " + article(x.type) + x.type + ": " + x.why + ".",
        actions: [["View booking", "goreq", x.r.id]],
      });
    for (const l of s.loans)
      if (l.back && l.missing && l.missing.length)
        list.push({
          level: "warn",
          title: unitLabel(l.asset) + " came back without: " + l.missing.join(", "),
          sub:
            getReq(l.req).club +
            " · slip L-" +
            l.num +
            " · returned " +
            fmt(l.returnedAt) +
            " by " +
            l.returnedBy,
          actions: l.missing.map((m) => [m + " returned", "partback", l.num + "|" + m]),
        });
    const open = openLoans().sort((a, b) => dueAt(a.due) - dueAt(b.due));
    for (const l of open)
      if (overdue(l))
        list.push({
          level: "warn",
          title: unitLabel(l.asset) + " is overdue",
          sub:
            getReq(l.req).club +
            " · issued to " +
            l.who +
            " · due " +
            l.due +
            " · " +
            (l.withWho
              ? heldBy(l).replace(/^With/, "with") +
                (expectedLate(l) ? " (also late)" : "")
              : "nobody has recorded where it is"),
          actions: [
            ["Return…", "goreturn", l.asset, "primary"],
            ["Still out with…", "gostill", String(l.num)],
          ],
        });
    for (const r of requests) {
      const lines = lineState(r);
      const issued = lines.filter((x) => x.open || x.done);
      const missing = lines.filter((x) => !x.open && !x.done);
      if (!issued.length && !lapsed(r) && dueAt(r.pickup) <= now() + 60)
        list.push({
          level: now() > dueAt(r.pickup) ? "warn" : "todo",
          title: r.club + " pickup · " + r.pickup,
          sub:
            r.items.length +
            " item" +
            (r.items.length > 1 ? "s" : "") +
            " · may collect: " +
            collectors(r).join(", "),
          actions: [
            ["Issue kit", "gokit", r.id, "primary"],
            ["View form", "goreq", r.id],
          ],
        });
      else if (issued.length && missing.length && lines.some((x) => x.open))
        list.push({
          level: "warn",
          title: r.club + " kit left without: " + missing.map((x) => x.type).join(", "),
          sub: r.note,
          actions: [["Issue missing items", "gokit", r.id, "primary"]],
        });
    }
    return list;
  }
  function upcoming() {
    const list = [];
    for (const l of openLoans())
      if (!overdue(l))
        list.push({
          at: dueAt(l.expected || l.due),
          title: unitLabel(l.asset) + " · due back " + l.due,
          sub:
            getReq(l.req).club +
            " · issued to " +
            l.who +
            (l.withWho ? " · " + heldBy(l) : ""),
          actions: [["Return…", "goreturn", l.asset]],
        });
    for (const r of requests)
      if (!loansFor(r.id).length && dueAt(r.pickup) > now() + 60 && !lapsed(r))
        list.push({
          at: dueAt(r.pickup),
          title: r.club + " pickup · " + r.pickup,
          sub: r.items.join(", ") + " · may collect: " + collectors(r).join(", "),
          actions: [["View form", "goreq", r.id]],
        });
    return list.sort((a, b) => a.at - b.at);
  }
  // What the next shift would inherit without an explanation.
  // Bookings: approved requests not yet collected. Walk them in pickup order and
  // give each the unit that is free soonest; any line left without a unit is at risk.
  function bookingRisks(extra = [], skipReq = "") {
    const free = {};
    for (const a of assets) {
      if (inRepair(a.id)) continue;
      const l = out(a.id);
      free[a.id] = l ? dueAt(l.expected || l.due) : 0;
    }
    for (const x of extra) free[x.asset] = x.until;
    const risks = [];
    const bookings = requests
      .filter((r) => r.id !== skipReq && !loansFor(r.id).length && !lapsed(r))
      .sort((a, b) => dueAt(a.pickup) - dueAt(b.pickup));
    for (const r of bookings) {
      const at = Math.max(dueAt(r.pickup), now());
      for (const type of r.items) {
        const ids = Object.keys(free)
          .filter((id) => getAsset(id).type === type && free[id] <= at)
          .sort((a, b) => free[a] - free[b]);
        if (ids.length) {
          free[ids[0]] = dueAt(r.due);
          continue;
        }
        const why = assets
          .filter((a) => a.type === type)
          .map((a) => {
            if (inRepair(a.id)) return a.id + " in repair";
            const ex = extra.find((x) => x.asset === a.id);
            if (ex) return a.id + " would be out until " + fmt(ex.until);
            const l = out(a.id);
            if (l) return a.id + " out until " + (l.expected || l.due);
            return a.id + " promised to an earlier booking";
          });
        risks.push({ r, type, why: why.join(", ") || "no unit of this type" });
      }
    }
    return risks;
  }
  const article = (w) => (/^(HDMI|[AEIOU])/i.test(w) ? "an " : "a ");
  const riskText = (x) =>
    x.r.club + " needs " + article(x.type) + x.type + " at " + x.r.pickup + " — " + x.why + ".";
  // The next booking that will want a unit of this type once it's back.
  const nextNeed = (type) =>
    requests
      .filter(
        (r) =>
          !loansFor(r.id).length &&
          !lapsed(r) &&
          r.items.includes(type) &&
          dueAt(r.pickup) >= now() - 60,
      )
      .sort((a, b) => dueAt(a.pickup) - dueAt(b.pickup))[0];
  function handoverIssues(nextAt) {
    const list = [];
    for (const r of requests)
      if (!loansFor(r.id).length && !lapsed(r) && dueAt(r.pickup) < nextAt)
        list.push({
          text:
            r.club +
            " kit hasn’t been issued. Pickup was " +
            r.pickup +
            ".",
          fix: ["Issue kit", "gokit", r.id],
        });
    for (const l of openLoans())
      if (dueAt(l.due) < nextAt && !l.withWho)
        list.push({
          text:
            unitLabel(l.asset) +
            " (slip L-" +
            l.num +
            ") will be overdue by then, and nobody has recorded where it is.",
          fix: ["Record whereabouts", "gostill", String(l.num)],
        });
    for (const x of bookingRisks())
      list.push({
        text: "Booking at risk: " + riskText(x),
        fix: ["View booking", "goreq", x.r.id],
      });
    return list;
  }

  /* ------------------------------------------------------------------ */
  /* Markup helpers                                                      */
  /* ------------------------------------------------------------------ */
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list, sel = "", disabled = () => false) =>
    list
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === sel ? " selected" : "") +
          (disabled(v) ? " disabled" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
      .join("");
  const btn = (label, act, val = "", style = "", extra = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '"' +
    extra +
    ">" +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2 tabindex="-1">' +
    esc(title) +
    "</h2><small>" +
    esc(sub) +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right, extra = "") =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small>" +
    extra +
    '</div><div class="rowactions">' +
    right +
    "</div></div>";
  const badge = (t, tone = "") =>
    '<span class="tag' + (tone ? " " + tone : "") + '">' + esc(t) + "</span>";
  const timeField = (name, label, parts, note = "") =>
    '<fieldset class="timefield"><legend>' +
    esc(label) +
    '</legend><select name="' +
    name +
    'Day" aria-label="' +
    esc(label) +
    ' · day"><option value="">Day…</option>' +
    opts(
      days.map((d, i) => [d, longDays[i]]),
      parts.day,
      (d) => (days.indexOf(d) + 1) * 1440 <= now(),
    ) +
    '</select><input type="time" name="' +
    name +
    'Time" step="300" value="' +
    esc(parts.time) +
    '" aria-label="' +
    esc(label) +
    ' · time" />' +
    (note ? "<small>" + note + "</small>" : "") +
    "</fieldset>";
  // A desk-book entry body: structured lines for summaries, plain text otherwise.
  const bodyHtml = (e) =>
    Array.isArray(e.lines) && e.lines.length
      ? '<dl class="summarylist">' +
        e.lines
          .map(
            (x) =>
              "<div><dt>" +
              esc(x.label) +
              "</dt><dd><ul>" +
              x.items.map((i) => "<li>" + esc(i) + "</li>").join("") +
              "</ul></dd></div>",
          )
          .join("") +
        "</dl>"
      : "<p>" + esc(e.text) + "</p>";
  const hint = (text, tone = "") =>
    '<p class="hint' + (tone ? " " + tone : "") + '">' + text + "</p>";
  const item = (x) =>
    '<div class="item ' +
    (x.level || "") +
    '"><div><strong>' +
    esc(x.title) +
    "</strong><small>" +
    esc(x.sub) +
    '</small></div><div class="rowactions">' +
    x.actions.map(([t, a, v, st]) => btn(t, a, v, st || "")).join("") +
    "</div></div>";
  const peopleList = () =>
    '<datalist id="people">' +
    opts(people.map((p) => [p, p])) +
    "</datalist>";

  /* ------------------------------------------------------------------ */
  /* Screens                                                             */
  /* ------------------------------------------------------------------ */
  function todayPage() {
    const shift = shifts[s.phase];
    const open = openLoans();
    const pending = requests.filter(
      (r) => !loansFor(r.id).length && !lapsed(r),
    );
    const repairs = assets.filter((a) => inRepair(a.id));
    const late = open.filter(overdue);
    const tile = (label, n, target, tone = "") =>
      '<button type="button" class="tile ' +
      tone +
      '" data-action="tile" data-val="' +
      esc(target) +
      '"><strong>' +
      n +
      "</strong><span>" +
      esc(label) +
      "</span></button>";
    let html =
      head("Today at the desk", shift.time + " · " + shift.title) +
      '<div class="tiles">' +
      tile("Out on loan", open.length, "Loan register") +
      tile("Overdue", late.length, "Loan register", late.length ? "warn" : "") +
      tile("Awaiting pickup", pending.length, "Requests") +
      tile("In repair", repairs.length, "Inventory|In repair") +
      "</div>";
    const att = attention();
    html += "<h3 class=\"group\">Needs attention</h3>";
    html += att.length
      ? att.map(item).join("")
      : hint("Nothing needs action right now.", "good");
    const since = s.phase ? shifts[s.phase - 1].at : Infinity;
    const prev = deskEntries().filter(
      (e) => e.at >= since && e.at < shift.at && e.kind !== "club",
    );
    if (prev.length) {
      html +=
        '<h3 class="group">Handed over by the previous shift (' +
        esc(shifts[s.phase - 1].time) +
        ")</h3>";
      html += prev
        .map(
          (e) =>
            '<div class="item note"><div><strong>' +
            esc(e.author) +
            "</strong><small>" +
            esc(fmt(e.at)) +
            "</small>" +
            bodyHtml(e) +
            "</div></div>",
        )
        .join("");
    }
    const up = upcoming();
    html += '<h3 class="group">Coming up</h3>';
    html += up.length
      ? up.map(item).join("")
      : hint("Nothing else is due back or waiting for pickup.");
    return html;
  }

  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · " + requests.length + " approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      const [st, tone] = reqStatus(r);
      const lines = lineState(r);
      const canIssue =
        !lapsed(r) && lines.some((x) => !x.open && !x.done);
      html +=
        btn("← Back to list", "close", "", "ghost") +
        '<div class="record"><small>' +
        esc(r.id) +
        " · Approved · " +
        badge(st, tone) +
        "</small><h3>" +
        esc(r.event) +
        "</h3><p>" +
        esc(r.club) +
        " · Filed by " +
        esc(r.owner) +
        "</p><p><b>Pickup</b> " +
        esc(r.pickup) +
        " · <b>Return by</b> " +
        esc(r.due) +
        "</p><p>" +
        esc(r.note) +
        "</p>" +
        bookingRisks()
          .filter((x) => x.r.id === r.id)
          .map((x) => hint("<b>Booking at risk.</b> Needs " + article(x.type) + esc(x.type) + ": " + esc(x.why) + ".", "warn"))
          .join("") +
        "<p><b>May collect</b> " +
        collectors(r)
          .map((p) => esc(p) + " <small>(" + esc(authority(r, p)) + ")</small>")
          .join(", ") +
        '</p><h3 class="group">Approved equipment</h3>' +
        lines
          .map((x) =>
            row(
              x.type,
              x.open
                ? "Slip L-" +
                    x.open.num +
                    " · " +
                    x.open.asset +
                    " · issued to " +
                    x.open.who +
                    " · due " +
                    x.open.due
                : x.done
                  ? "Slip L-" +
                    x.done.num +
                    " · " +
                    x.done.asset +
                    " · returned " +
                    fmt(x.done.returnedAt) +
                    " by " +
                    x.done.returnedBy
                  : available(x.type).length
                    ? "Not issued · on shelf: " +
                      available(x.type)
                        .map((a) => a.id + " (bin " + a.bin + ")")
                        .join(", ")
                    : "Not issued · none on the shelf",
              x.open
                ? (overdue(x.open) ? badge("Overdue", "warn") : badge("Out")) +
                    btn("Return…", "goreturn", x.open.asset)
                : x.done
                  ? badge(
                      x.done.condition === "damaged" ? "Back · damaged" : "Back",
                      x.done.condition === "damaged" ? "warn" : "good",
                    )
                  : badge("Not issued", available(x.type).length ? "" : "warn"),
            ),
          )
          .join("") +
        '<div class="buttons">' +
        (canIssue
          ? btn("Issue kit", "gokit", r.id, "primary")
          : "") +
        "</div>" +
        (lapsed(r) && lines.some((x) => !x.open && !x.done)
          ? hint(
              "This approval ended at " +
                esc(r.due) +
                ". Anything not yet issued needs a new approved request.",
              "warn",
            )
          : "") +
        "</div>";
    } else
      html += requests
        .map((r) => {
          const [st, tone] = reqStatus(r);
          return row(
            r.event,
            r.id + " · " + r.club + " · pickup " + r.pickup + " · return by " + r.due,
            badge(st, tone) +
              (bookingRisks().some((x) => x.r.id === r.id) ? badge("Booking at risk", "warn") : "") +
              btn("View form", "request", r.id),
          );
        })
        .join("");
    return html;
  }

  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
      s.adding ? "" : btn("Add equipment", "add", "", "primary"),
    );
    if (s.adding) {
      const t0 = types()[0];
      html +=
        '<form data-add class="record" novalidate><small>Add a physical unit · it can be issued once an approved request lists its type</small><div class="form">' +
        '<label><span>Equipment type</span><select name="type">' +
        opts([...types().map((t) => [t, t]), ["__new", "New type…"]], t0) +
        "</select></label>" +
        '<label data-newtype hidden><span>New type name</span><input name="newType" maxlength="40" autocomplete="off" placeholder="e.g. Tripod" /></label>' +
        '<label><span>Tag code</span><input name="code" maxlength="5" autocomplete="off" value="' +
        esc(nextCode(prefixOf(t0))) +
        '" data-suggested="' +
        esc(nextCode(prefixOf(t0))) +
        '" placeholder="e.g. TR-01" /></label>' +
        '<label><span>Make and model</span><input name="model" maxlength="40" autocomplete="off" placeholder="e.g. Manfrotto 190X" /></label>' +
        '<label><span>Home bin</span><input name="bin" maxlength="12" autocomplete="off" placeholder="e.g. D3" /></label>' +
        '</div><div class="buttons"><button type="submit" class="primary">Add to inventory</button>' +
        btn("Cancel", "canceladd") +
        "</div></form>";
    }
    const counts = { "All items": assets.length };
    for (const a of assets) {
      const st = unitStatus(a.id);
      counts[st] = (counts[st] || 0) + 1;
    }
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [
          f,
          f + " (" + (counts[f] || 0) + ")",
        ]),
        s.filter,
      ) +
      '</select></label><label class="grow">Search <input type="search" data-search placeholder="Code, type, model, bin or borrower" value="' +
      esc(s.search) +
      '" /></label></div>';
    const term = s.search.trim().toLowerCase();
    let shown = 0;
    for (const a of assets) {
      const st = unitStatus(a.id);
      const l = out(a.id);
      if (s.filter !== "All items" && s.filter !== st) continue;
      const hay = [a.id, a.type, a.model, "bin " + a.bin, l ? l.who : "", l && l.withWho ? l.withWho : ""]
        .join(" ")
        .toLowerCase();
      if (term && !hay.includes(term)) continue;
      shown++;
      html += row(
        a.id + " · " + a.type,
        a.model + " · bin " + a.bin,
        badge(st, st === "On shelf" ? "good" : st === "In repair" || (l && overdue(l)) ? "warn" : "") +
          (st === "In repair" ? btn("Mark repaired", "fixed", a.id) : ""),
        l
          ? '<small class="held">' +
              esc(
                "Slip L-" +
                  l.num +
                  " · " +
                  getReq(l.req).club +
                  " · issued to " +
                  l.who +
                  " · due " +
                  l.due +
                  (overdue(l) ? " · overdue" : "") +
                  (l.withWho ? " · " + heldBy(l) : ""),
              ) +
              "</small>"
          : inRepair(a.id)
            ? '<small class="held">' + esc(repairNote(a.id)) + "</small>"
            : "",
      );
    }
    if (!shown)
      html += hint(
        "No units match. " + (term ? "Try a shorter search or " : "") + "show all items.",
      );
    return html;
  }

  function kitForm() {
    const d = s.draft;
    const r = getReq(d.req);
    let html =
      '<form data-issue class="record kit" novalidate><small>New issue · one slip per unit, created together</small>' +
      '<div class="form"><label class="full"><span>Approved request</span><select name="req"><option value="">Select…</option>' +
      opts(
        requests.map((x) => [x.id, x.id + " · " + x.club + " · " + x.event]),
        d.req,
      ) +
      "</select></label>";
    if (!r) return html + "</div></form>";
    const lines = lineState(r);
    html +=
      '<label><span>Collected by</span><select name="who"><option value="">Who is at the counter?</option>' +
      opts(
        [
          ...people.map((p) => [p, p + (authority(r, p) ? " · may collect" : "")]),
          ["__other", "Someone not listed…"],
        ],
        d.other ? "__other" : d.who,
      ) +
      "</select>" +
      (d.other
        ? '<input name="whoOther" maxlength="60" autocomplete="off" placeholder="Full name as on their student ID" aria-label="Collector’s full name" value="' +
          esc(d.who) +
          '" />'
        : "") +
      "</label>" +
      timeField(
        "due",
        "Return by",
        { day: d.dueDay, time: d.dueTime },
        "Approved until " + esc(r.due) + ". Any time from now up to then.",
      ) +
      "</div>";
    if (lapsed(r))
      return (
        html +
        hint(
          "This approval ended at " +
            esc(r.due) +
            ". Nothing more can be issued against it — the club needs a new approved request.",
          "error",
        ) +
        "</form>"
      );
    if (d.who) {
      const auth = authority(r, d.who);
      html += auth
        ? hint("✓ " + esc(d.who) + " may collect · " + esc(auth), "good")
        : hint(
            esc(d.who) +
              " isn’t the filer or anyone the filer named. Check with " +
              esc(r.owner) +
              " before handing over equipment." +
              '<label class="check"><input type="checkbox" name="auth"' +
              (d.auth ? " checked" : "") +
              " /> I confirmed with " +
              esc(r.owner) +
              " that " +
              esc(d.who) +
              " may collect</label>",
            "warn",
          );
    }
    html += '<div class="lines" role="group" aria-label="Units leaving the desk">';
    lines.forEach((x, i) => {
      let right;
      if (x.open)
        right = badge("Already out · L-" + x.open.num + " · " + x.open.asset);
      else if (x.done)
        right = badge("Returned on L-" + x.done.num + " · not reissued");
      else {
        const av = available(x.type);
        right = av.length
          ? '<select name="pick' +
            i +
            '" aria-label="Unit for ' +
            esc(x.type) +
            '">' +
            opts(
              [
                ...av.map((a) => [a.id, a.id + " · " + a.model + " · bin " + a.bin]),
                ["", "Not issuing now"],
              ],
              d.picks[x.type] ?? "",
            ) +
            "</select>"
          : badge(
              "None on the shelf" +
                (assets.some((a) => a.type === x.type && inRepair(a.id))
                  ? " · " +
                    assets
                      .filter((a) => a.type === x.type && inRepair(a.id))
                      .map((a) => a.id)
                      .join(", ") +
                    " in repair"
                  : ""),
              "warn",
            );
      }
      html +=
        '<div class="line"><span>' +
        esc(x.type) +
        ((accessories[x.type] || []).length
          ? "<small>Goes with: " + esc(accessories[x.type].join(", ")) + "</small>"
          : "") +
        "</span>" +
        right +
        "</div>";
    });
    html += "</div>";
    const picked = issuable(d, r).picked;
    const left = issuable(d, r).left;
    const until = fromParts(d.dueDay, d.dueTime) ?? dueAt(r.due);
    const before = new Set(bookingRisks([], r.id).map((x) => x.r.id + x.type));
    const caused = bookingRisks(
      picked.map((id) => ({ asset: id, until })),
      r.id,
    ).filter((x) => !before.has(x.r.id + x.type));
    if (caused.length)
      html += hint(
        "<b>This clashes with a booking.</b> " +
          caused.map((x) => esc(riskText(x))).join(" ") +
          " Pick a different unit or an earlier return time if you can.",
        "warn",
      );
    if (picked.length && left.length)
      html += hint(
        "<b>The kit will leave incomplete.</b> Not issuing: " +
          esc(left.join(", ")) +
          ". Request note: “" +
          esc(r.note) +
          "”" +
          '<label class="check"><input type="checkbox" name="partial"' +
          (d.partial ? " checked" : "") +
          " /> Issue a partial kit anyway</label>",
        "warn",
      );
    if (!lines.some((x) => !x.open && !x.done))
      html += hint("Everything on this request is already issued.");
    html +=
      '<div class="buttons"><button type="submit" class="primary"' +
      (picked.length ? "" : " disabled") +
      ">" +
      esc(
        picked.length
          ? "Issue " +
              picked.length +
              " unit" +
              (picked.length > 1 ? "s" : "") +
              (d.who ? " to " + d.who : "")
          : "Choose units to issue",
      ) +
      "</button>" +
      btn("Cancel", "cancel") +
      "</div></form>";
    return html;
  }
  function issuable(d, r) {
    const picked = [],
      left = [];
    for (const x of lineState(r)) {
      if (x.open || x.done) continue;
      const av = available(x.type);
      const pick = d.picks[x.type];
      if (pick && av.some((a) => a.id === pick)) picked.push(pick);
      else if (av.length) left.push(x.type);
      else left.push(x.type + " (none on shelf)");
    }
    return { picked, left };
  }

  function returnCard(l) {
    const a = getAsset(l.asset),
      r = getReq(l.req);
    const line = (k, v) => "<div><dt>" + esc(k) + "</dt><dd>" + v + "</dd></div>";
    const rest = loansFor(r.id).filter((x) => x.num !== l.num);
    return (
      '<form data-return data-asset="' +
      esc(a.id) +
      '" class="record confirm" novalidate><small>Confirm return · Slip L-' +
      l.num +
      "</small><h3>" +
      esc(a.id + " · " + a.type) +
      '</h3><dl class="facts">' +
      line("Unit", esc(a.model) + " · <b>check the tag reads " + esc(a.id) + "</b>") +
      line("Request", esc(r.id + " · " + r.club + " · " + r.event)) +
      line("Issued to", esc(l.who + " · " + fmt(l.issuedAt))) +
      (l.withWho ? line("Whereabouts", esc(heldBy(l))) : "") +
      line(
        "Due",
        esc(l.due) + (overdue(l) ? " " + badge("Overdue", "warn") : ""),
      ) +
      (rest.length
        ? line(
            "Rest of kit",
            rest
              .map(
                (x) =>
                  esc(x.asset) +
                  " " +
                  (x.back ? badge("Back", "good") : badge("Still out")),
              )
              .join(" "),
          )
        : "") +
      (nextNeed(a.type)
        ? line(
            "Next needed",
            badge(nextNeed(a.type).club + " · " + nextNeed(a.type).pickup, "warn") +
              " keep it at the front, don’t bury it in the bin",
          )
        : "") +
      '</dl><div class="form"><label><span>Brought in by</span><input name="by" list="people" maxlength="60" autocomplete="off" value="' +
      esc(l.withWho || l.who) +
      '" /></label>' +
      '<fieldset class="full"><legend>Condition</legend><label class="check"><input type="radio" name="cond" value="good" checked /> Works, all parts — back to bin ' +
      esc(a.bin) +
      '</label><label class="check"><input type="radio" name="cond" value="damaged" /> Damaged or missing parts — send to repair</label></fieldset>' +
      (partsOf(a.id).length
        ? '<fieldset class="full parts"><legend>Came back with <small>(untick anything missing)</small></legend>' +
          partsOf(a.id)
            .map(
              (pt) =>
                '<label class="check"><input type="checkbox" name="part" value="' +
                esc(pt) +
                '" checked /> ' +
                esc(pt) +
                "</label>",
            )
            .join("") +
          "</fieldset>"
        : "") +
      '<label class="full"><span>Condition note <small>(required if damaged)</small></span><input name="note" maxlength="120" autocomplete="off" /></label></div>' +
      peopleList() +
      '<div class="buttons"><button type="submit" class="primary">Confirm return</button>' +
      btn("Cancel", "cancelreturn") +
      "</div></form>"
    );
  }

  function stillOutForm(l) {
    return (
      '<form data-stillout data-num="' +
      l.num +
      '" class="record" novalidate><small>Slip L-' +
      l.num +
      " · " +
      esc(unitLabel(l.asset)) +
      " · tell the next shift where this unit is</small>" +
      '<div class="form"><label><span>Who has it now <small>(pick or type a name)</small></span><input name="withWho" list="people" maxlength="60" autocomplete="off" value="' +
      esc(l.withWho || "") +
      '" /></label>' +
      peopleList() +
      timeField(
        "expected",
        "Expected back",
        toParts(l.expected ? dueAt(l.expected) : NaN),
        "Any time after now.",
      ) +
      '<label class="full"><span>Note <small>(optional)</small></span><input name="handoverNote" maxlength="120" autocomplete="off" value="' +
      esc(l.handoverNote || "") +
      '" /></label></div><div class="buttons"><button type="submit" class="primary">Save on slip</button>' +
      btn("Cancel", "cancelstill") +
      "</div></form>"
    );
  }

  function register() {
    const open = openLoans();
    let html = head(
      "Loan register",
      "One slip per physical unit · " + open.length + " open",
      s.editing
        ? ""
        : btn("New issue", "new", "", "primary"),
    );
    if (s.editing) return html + kitForm();
    const pending = s.returning && out(s.returning);
    if (pending) html += returnCard(pending);
    else {
      html +=
        '<form data-lookup class="lookup" novalidate><label><span>Return a unit</span><input name="code" list="onloan" placeholder="Type or scan the tag, e.g. AD-12" autocomplete="off" aria-describedby="lookuphint" /><small id="lookuphint">Shortcut: press / anywhere to jump here.</small></label><datalist id="onloan">' +
        opts(open.map((l) => [l.asset, unitLabel(l.asset)])) +
        '</datalist><button type="submit">Find slip</button></form>';
      const lr = s.lastReq && getReq(s.lastReq);
      if (lr) {
        const ls = loansFor(lr.id);
        const still = ls.filter((l) => !l.back);
        html += hint(
          "<b>" +
            esc(lr.club) +
            " kit:</b> " +
            (ls.length - still.length) +
            " of " +
            ls.length +
            " back. " +
            (still.length
              ? "Still out: " +
                still
                  .map(
                    (l) =>
                      esc(unitLabel(l.asset)) +
                      " " +
                      btn("Return…", "return", l.asset, "small"),
                  )
                  .join(" ")
              : "Everything is back."),
          still.length ? "" : "good",
        );
      }
    }
    html +=
      '<div class="buttons">' +
      [
        ["Outstanding", open.length],
        ["All slips", s.loans.length],
      ]
        .map(
          ([v, n], i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            " (" +
            n +
            ")</button>",
        )
        .join("") +
      "</div>";
    const eff = (l) => dueAt(l.expected || l.due);
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .sort(
        (a, b) =>
          a.back - b.back ||
          (a.back ? b.num - a.num : overdue(b) - overdue(a) || eff(a) - eff(b)),
      );
    if (!shown.length) html += hint("No outstanding slips. Everything is back.", "good");
    for (const l of shown) {
      const r = getReq(l.req);
      const damaged = l.condition === "damaged";
      html +=
        '<div class="row' +
        (overdue(l) ? " late" : "") +
        '"><div><strong>' +
        esc("L-" + l.num + " · " + unitLabel(l.asset)) +
        "</strong><small>" +
        esc(r.club + " · " + l.req + " · issued to " + l.who + " · due " + l.due) +
        "</small>" +
        (l.withWho && !l.back
          ? '<small class="held">' + esc(heldBy(l)) + "</small>"
          : "") +
        (l.back && l.missing && l.missing.length
          ? '<small class="held">' +
            esc("Still to come back: " + l.missing.join(", ")) +
            "</small>"
          : "") +
        (l.back
          ? "<small>" +
            esc(
              "Returned " +
                fmt(l.returnedAt) +
                " by " +
                l.returnedBy +
                (damaged ? " · damaged: " + l.condNote : ""),
            ) +
            "</small>"
          : "") +
        '</div><div class="rowactions">' +
        (l.back
          ? badge(damaged ? "Sent to repair" : "Returned", damaged ? "warn" : "good")
          : (overdue(l) ? badge("Overdue", "warn") : "") +
            btn("Return…", "return", l.asset, "primary")) +
        '<details class="more"><summary aria-label="More actions for slip L-' +
        l.num +
        '">⋯</summary><div class="menu">' +
        (l.back ? "" : btn("Still out with…", "still", String(l.num))) +
        btn(
          s.history === l.num ? "Hide history" : "Show history",
          "history",
          String(l.num),
          "",
          ' aria-expanded="' + (s.history === l.num) + '"',
        ) +
        "</div></details>" +
        "</div></div>";
      if (s.stillOut === l.num && !l.back) html += stillOutForm(l);
      if (s.history === l.num)
        html +=
          '<ol class="history">' +
          l.log
            .map(
              (e) =>
                "<li><small>" +
                esc(fmt(e.at)) +
                "</small> " +
                esc(e.text) +
                (e.by ? " <small>· recorded by " + esc(e.by) + "</small>" : "") +
                "</li>",
            )
            .join("") +
          "</ol>";
    }
    return html;
  }

  function deskEntries() {
    const list = deskMessages
      .filter((m) => m.at <= now())
      .map((m) => ({ ...m, kind: "club" }));
    for (const n of s.notes)
      list.push({
        at: n.at,
        kind: n.kind || "note",
        ref: n.ref || "",
        author:
          n.kind === "summary"
            ? "Shift summary · written at handover"
            : "Counter handover note" + (n.by ? " · " + n.by : ""),
        text: n.text,
        lines: n.lines,
      });
    for (const l of s.loans)
      if (l.withWho)
        list.push({
          at: l.handoverAt,
          kind: "slip",
          ref: "L-" + l.num,
          author: "Whereabouts on slip L-" + l.num + " · " + unitLabel(l.asset),
          text: heldBy(l) + "." + (l.back ? " Now returned." : " Still open."),
        });
    return list
      .map((e, i) => [e, i])
      .sort((a, b) => b[0].at - a[0].at || b[1] - a[1])
      .map(([e]) => e);
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    html +=
      '<form data-note class="record" novalidate><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400"></textarea></label><label class="full"><span>About <small>(links the note to a slip or request)</small></span><select name="ref"><option value="">Nothing specific</option>' +
      opts([
        ...openLoans().map((l) => ["L-" + l.num, "Slip L-" + l.num + " · " + unitLabel(l.asset)]),
        ...requests.map((r) => [r.id, r.id + " · " + r.club]),
      ]) +
      '</select></label></div><button type="submit">Add handover note</button></form>';
    for (const e of deskEntries())
      html +=
        '<article class="record ' +
        e.kind +
        '"><small>' +
        esc(fmt(e.at, true)) +
        "</small><h3>" +
        esc(e.author) +
        "</h3>" +
        bodyHtml(e) +
        (e.ref ? '<p class="buttons">' + btn("Open " + e.ref, "ref", e.ref, "small") + "</p>" : "") +
        "</article>";
    return html;
  }

  function checkPanel() {
    const next = shifts[s.phase + 1];
    const issues = handoverIssues(next.at);
    return (
      '<section class="checklist" data-check aria-labelledby="checkhead"><h2 id="checkhead" tabindex="-1">Before you move to ' +
      esc(next.time) +
      "</h2><p>The next shift only knows what’s in the records. " +
      (issues.length
        ? "These would be left unexplained:"
        : "Everything is accounted for.") +
      "</p><ul>" +
      issues
        .map(
          (x) =>
            "<li><span>" +
            esc(x.text) +
            "</span>" +
            btn(x.fix[0], x.fix[1], x.fix[2], "small") +
            "</li>",
        )
        .join("") +
      '</ul><div class="buttons">' +
      btn("Move on anyway", "force") +
      btn("Stay and fix", "staycheck", "", "primary") +
      "</div></section>"
    );
  }

  const screens = {
    Today: todayPage,
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };

  /* ------------------------------------------------------------------ */
  /* Rendering                                                           */
  /* ------------------------------------------------------------------ */
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent =
      "Step " + (s.phase + 1) + " of " + shifts.length + " · " + phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    const att = attention();
    const open = openLoans();
    const counts = {
      Today: [att.length, att.some((x) => x.level === "warn")],
      "Loan register": [open.length, open.some(overdue)],
    };
    q("[data-nav]").innerHTML = pages
      .map(([n, icon]) => {
        const [c, warn] = counts[n] || [0, false];
        return (
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg><span>' +
          n +
          "</span>" +
          (c
            ? '<span class="count' +
              (warn ? " warn" : "") +
              '" aria-label="' +
              c +
              (warn ? " including overdue" : "") +
              '">' +
              c +
              "</span>"
            : "") +
          "</button>"
        );
      })
      .join("") +
      '<div class="staffbox">' +
      (s.staff
        ? "<small>On the desk</small><strong>" +
          esc(s.staff) +
          "</strong>" +
          btn("Sign out", "signout", "", "small ghost")
        : "<small>On the desk</small><strong>Nobody signed in</strong>" +
          btn("Sign in", "gosignin", "", "small primary")) +
      '<button type="button" class="small ghost keys" data-action="keys" aria-expanded="' +
      s.shortcuts +
      '">Keyboard shortcuts</button>' +
      (s.shortcuts
        ? '<ul class="keylist"><li><kbd>/</kbd> Return a unit</li><li><kbd>N</kbd> New issue</li><li><kbd>T</kbd> Today</li><li><kbd>Esc</kbd> Close a form</li></ul>'
        : "") +
      "</div>";
    q("[data-page]").innerHTML =
      (s.staff
        ? ""
        : '<form data-signin class="signinstrip" novalidate><div><strong>Nobody is signed in.</strong><small>You can look things up, but sign in before issuing, returning or writing notes.</small></div><label><span class="sr">Who is on the desk</span><select name="staff"><option value="">Choose your name…</option>' +
          opts(staffList.map((x) => [x, x])) +
          '</select></label><button type="submit" class="primary">Start shift</button></form>') +
      (s.check && phase.next ? checkPanel() : "") +
      screens[s.tab]();
    const status = q("[data-status]");
    if (s.notice !== status.textContent && s.tone) toast(s.notice, s.tone);
    status.textContent = s.notice;
    status.className = s.tone ? "tone-" + s.tone : "";
    const undo = q('[data-action="undo"]');
    undo.hidden = !s.undo;
    undo.textContent = s.undo ? "Undo " + s.undo.label : "";
    q('[data-action="restart"]').textContent = s.confirmRestart
      ? "Yes, erase this shift"
      : "Restart sample shift";
    q('[data-action="restart"]').classList.toggle("danger", s.confirmRestart);
    if (s.focus) {
      const el = q(s.focus);
      s.focus = "";
      if (el) el.focus();
    }
  }
  function save() {
    try {
      const { draft, focus, confirmRestart, ...keep } = s;
      localStorage.setItem(storageKey, JSON.stringify(keep));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  function commit(msg, tone = "") {
    if (msg !== undefined) {
      s.notice = msg;
      s.tone = tone;
    }
    paint();
    save();
  }
  const needStaff = () =>
    fail(
      "Sign in first — every record shows who on the desk made it.",
      ".signinstrip select",
    );
  // A short-lived toast so results show up where people are looking. The status bar
  // stays the announced (aria-live) copy, so the toast is hidden from screen readers.
  let toastTimer = 0;
  function toast(msg, tone) {
    let el = q(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("aria-hidden", "true");
      root.append(el);
    }
    el.textContent = msg;
    el.className = "toast show tone-" + tone;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), tone === "error" ? 6000 : 3500);
  }
  // Reject a form without redrawing, so whatever the person entered stays put.
  const fail = (msg, focus = "") => {
    s.notice = msg;
    s.tone = "error";
    const status = q("[data-status]");
    toast(msg, "error");
    status.textContent = msg;
    status.className = "tone-error";
    for (const el of root.querySelectorAll("[aria-invalid]"))
      el.removeAttribute("aria-invalid");
    const el = focus && q(focus);
    if (el) {
      el.setAttribute("aria-invalid", "true");
      el.focus();
    }
  };
  // Record an undo point, then change the records.
  function mutate(label, fn) {
    s.undo = {
      label,
      snap: JSON.stringify({
        loans: s.loans,
        notes: s.notes,
        repairs: s.repairs,
        fixed: s.fixed,
        added: s.added,
        extraPeople: s.extraPeople,
      }),
    };
    fn();
  }
  const closeForms = () => {
    s.editing = false;
    s.adding = false;
    s.draft = null;
    s.returning = "";
    s.stillOut = 0;
  };
  function newDraft(req) {
    const r = getReq(req);
    const picks = {};
    if (r)
      for (const x of lineState(r))
        if (!x.open && !x.done) {
          const av = available(x.type);
          picks[x.type] = av[0] ? av[0].id : "";
        }
    return {
      req: r ? r.id : "",
      who: "",
      ...(() => {
        const p = toParts(r && dueAt(r.due) > now() ? dueAt(r.due) : NaN);
        return { dueDay: p.day, dueTime: p.time };
      })(),
      picks,
      auth: false,
      partial: false,
      other: false,
    };
  }
  function openReturn(id) {
    closeForms();
    s.tab = "Loan register";
    s.returning = id;
    s.lastReq = "";
    s.focus = "[data-return] [name=by]";
    s.notice = "Check the tag on the unit matches " + id + ", then confirm.";
    s.tone = "";
  }
  function summarise() {
    const t = now();
    const issued = s.loans.filter((l) => l.issuedAt === t);
    const back = s.loans.filter((l) => l.back && l.returnedAt === t);
    const open = openLoans();
    const lines = [];
    if (s.staff) lines.push({ label: "Handed over by", items: [s.staff] });
    if (issued.length)
      lines.push({ label: "Issued", items: issued.map((l) => l.asset + " to " + l.who) });
    if (back.length)
      lines.push({
        label: "Returned",
        items: back.map(
          (l) => l.asset + (l.condition === "damaged" ? " (damaged, sent to repair)" : ""),
        ),
      });
    lines.push({
      label: "Still out",
      items: open.length
        ? open.map(
            (l) =>
              l.asset +
              " · " +
              getReq(l.req).club +
              " · " +
              (l.withWho
                ? "with " + l.withWho + ", expected " + l.expected
                : l.who + ", due " + l.due) +
              (overdue(l) ? " · overdue" : ""),
          )
        : ["Nothing"],
    });
    const missingParts = s.loans.filter((l) => l.back && l.missing && l.missing.length);
    if (missingParts.length)
      lines.push({
        label: "Parts to come back",
        items: missingParts.map(
          (l) => l.asset + " " + l.missing.join(", ") + " (" + l.returnedBy + ")",
        ),
      });
    const risks = bookingRisks();
    if (risks.length) lines.push({ label: "Bookings at risk", items: risks.map(riskText) });
    s.notes.push({
      at: t,
      kind: "summary",
      text: lines.map((x) => x.label + ": " + x.items.join("; ") + ".").join(" "),
      lines,
      by: s.staff,
    });
  }
  function advance() {
    summarise();
    s.phase++;
    closeForms();
    s.check = false;
    s.undo = null;
    s.lastReq = "";
    s.tab = "Today";
    s.focus = "[data-page] h2";
    s.staff = "";
    s.notice =
      "It’s now " +
      shifts[s.phase].time +
      ". A shift summary was added to the Desk book. Sign in to take over the desk.";
    s.tone = "";
  }
  const normCode = (raw) => {
    const t = String(raw || "")
      .toUpperCase()
      .replace(/[\s_]+/g, "");
    const m = /^([A-Z]{2})-?(\d{1,2})$/.exec(t);
    return m ? m[1] + "-" + m[2].padStart(2, "0") : t;
  };

  /* ------------------------------------------------------------------ */
  /* Theme: a per-browser preference, kept apart from the shift records  */
  /* ------------------------------------------------------------------ */
  const themeKey = "campus-stores.theme";
  const currentTheme = () =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  // Light by default; a click switches and the choice is remembered in this browser.
  function setTheme(mode, persist = true) {
    mode = mode === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = mode;
    const other = mode === "dark" ? "light" : "dark";
    const b = q('[data-action="theme"]');
    b.setAttribute("aria-label", "Switch to " + other + " theme");
    b.title = "Switch to " + other + " theme";
    if (!persist) return;
    try {
      localStorage.setItem(themeKey, mode);
    } catch {
      // The choice still applies for this visit.
    }
  }
  try {
    setTheme(localStorage.getItem(themeKey), false);
  } catch {
    setTheme("light", false);
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b || b.disabled) return;
    const a = b.dataset.action,
      v = b.dataset.val;
    if (a === "theme")
      return setTheme(currentTheme() === "dark" ? "light" : "dark");
    if (a !== "restart") s.confirmRestart = false;
    switch (a) {
      case "restart":
        if (!s.confirmRestart) {
          s.confirmRestart = true;
          return commit(
            "This erases every slip and note in this browser. Click again to confirm.",
            "warn",
          );
        }
        s = original();
        syncLists();
        s.notice = "Fresh sample shift started.";
        break;
      case "advance":
        if (!shifts[s.phase].next) return;
        if (!s.check && handoverIssues(shifts[s.phase + 1].at).length) {
          s.check = true;
          s.focus = "#checkhead";
          s.notice = "Check the handover before time moves on.";
          s.tone = "warn";
          break;
        }
        advance();
        break;
      case "force":
        if (shifts[s.phase].next) advance();
        break;
      case "staycheck":
        s.check = false;
        s.notice = "Fix the open items, then move on.";
        s.tone = "";
        break;
      case "tab":
        s.tab = v;
        closeForms();
        s.lastReq = "";
        s.focus = "[data-page] h2";
        break;
      case "tile": {
        const [tab, filter] = v.split("|");
        s.tab = tab;
        closeForms();
        if (filter) s.filter = filter;
        if (tab === "Loan register") s.onlyOpen = true;
        s.focus = "[data-page] h2";
        break;
      }
      case "close":
        s.selected = "";
        break;
      case "request":
      case "goreq":
        s.tab = "Requests";
        s.selected = v;
        closeForms();
        s.focus = "[data-page] h3";
        break;
      case "ref":
        if (v.startsWith("RQ-")) {
          s.tab = "Requests";
          s.selected = v;
        } else {
          s.tab = "Loan register";
          s.onlyOpen = false;
          s.history = Number(v.slice(2));
        }
        closeForms();
        break;
      case "new":
        closeForms();
        s.editing = true;
        s.draft = newDraft("");
        s.focus = "[data-issue] [name=req]";
        break;
      case "gokit":
        closeForms();
        s.check = false;
        s.tab = "Loan register";
        s.editing = true;
        s.draft = newDraft(v);
        s.focus = "[data-issue] [name=who]";
        break;
      case "cancel":
        closeForms();
        s.notice = "Nothing was issued.";
        s.tone = "";
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "return":
      case "goreturn":
        if (!out(v)) return commit(v + " has no open slip.", "error");
        openReturn(v);
        break;
      case "cancelreturn":
        s.returning = "";
        s.notice = "Nothing was returned.";
        s.tone = "";
        s.focus = "[data-lookup] input";
        break;
      case "still":
      case "gostill":
        closeForms();
        s.check = false;
        s.tab = "Loan register";
        s.stillOut = s.stillOut === Number(v) && a === "still" ? 0 : Number(v);
        s.focus = "[data-stillout] [name=withWho]";
        break;
      case "cancelstill":
        s.stillOut = 0;
        break;
      case "history":
        s.history = s.history === Number(v) ? 0 : Number(v);
        break;
      case "add":
        closeForms();
        s.adding = true;
        s.focus = "[data-add] [name=type]";
        break;
      case "canceladd":
        s.adding = false;
        s.notice = "Nothing was added.";
        s.tone = "";
        break;
      case "gosignin":
        s.focus = ".signinstrip select";
        break;
      case "signout":
        s.notice = s.staff + " signed out. Sign in before changing any records.";
        s.tone = "";
        s.staff = "";
        s.focus = ".signinstrip select";
        break;
      case "keys":
        s.shortcuts = !s.shortcuts;
        break;
      case "partback": {
        if (!s.staff) return needStaff();
        const [num, part] = [v.slice(0, v.indexOf("|")), v.slice(v.indexOf("|") + 1)];
        const l = getLoan(num);
        if (!l || !l.missing || !l.missing.includes(part)) return;
        mutate(part + " for " + l.asset, () => {
          l.missing = l.missing.filter((m) => m !== part);
          l.log.push(entry(part + " returned."));
        });
        s.notice = part + " for " + l.asset + " is back. " + (l.missing.length ? "Still missing: " + l.missing.join(", ") + "." : "The kit is complete.");
        s.tone = "ok";
        break;
      }
      case "fixed": {
        if (!s.staff) return needStaff();
        if (!getAsset(v) || !inRepair(v) || out(v)) return;
        mutate("repair of " + v, () => {
          delete s.repairs[v];
          if (getAsset(v).repair && !s.fixed.includes(v)) s.fixed.push(v);
        });
        s.notice = v + " is repaired and back on the shelf in bin " + homeBin(v) + ".";
        s.tone = "ok";
        break;
      }
      case "undo": {
        if (!s.undo) return;
        const snap = JSON.parse(s.undo.snap);
        const label = s.undo.label;
        s.loans = snap.loans;
        s.notes = snap.notes;
        s.repairs = snap.repairs;
        s.fixed = snap.fixed;
        s.added = snap.added;
        s.extraPeople = snap.extraPeople;
        syncLists();
        s.undo = null;
        closeForms();
        s.lastReq = "";
        s.notice = "Undone: " + label + ".";
        s.tone = "";
        break;
      }
      default:
        return;
    }
    commit();
  });

  // Copy the issue form into the draft so a redraw keeps what was chosen.
  function syncDraft(f, name) {
    const val = (n) => (f.elements[n] ? f.elements[n].value : "");
    if (name === "req") {
      const { who, other } = s.draft;
      s.draft = newDraft(val("req"));
      s.draft.who = who;
      s.draft.other = other;
    } else {
      const d = s.draft;
      const prevWho = d.who;
      if (val("who") === "__other") {
        // A typed name that matches someone listed becomes that person.
        const typed = canonName(val("whoOther"));
        d.who = typed;
        d.other = !people.includes(typed);
      } else {
        d.other = false;
        d.who = val("who");
      }
      d.dueDay = val("dueDay");
      d.dueTime = val("dueTime");
      d.auth = !!(f.elements.auth && f.elements.auth.checked);
      d.partial = !!(f.elements.partial && f.elements.partial.checked);
      const r = getReq(d.req);
      if (r)
        r.items.forEach((type, i) => {
          if (f.elements["pick" + i]) d.picks[type] = val("pick" + i);
        });
      if (d.who !== prevWho) d.auth = false;
    }
  }
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.matches("[data-filter]")) {
      s.filter = t.value;
      return commit();
    }
    const addForm = t.closest("[data-add]");
    if (addForm && t.name === "type") {
      // Suggest the next free tag code for the chosen type, without a redraw.
      const isNew = t.value === "__new";
      addForm.querySelector("[data-newtype]").hidden = !isNew;
      const code = addForm.elements.code;
      const suggestion = isNew ? "" : nextCode(prefixOf(t.value));
      if (!code.value || code.value === code.dataset.suggested) code.value = suggestion;
      code.dataset.suggested = suggestion;
      if (isNew) addForm.elements.newType.focus();
      return;
    }
    const f = t.closest("[data-issue]");
    if (f && s.draft && (t.name === "dueDay" || t.name === "dueTime")) {
      // Keep the draft current without a redraw, so typing a time isn't interrupted.
      syncDraft(f, t.name);
      return save();
    }
    if (f && s.draft) {
      syncDraft(f, t.name);
      s.focus =
        t.name === "who" && s.draft.other
          ? "[data-issue] [name=whoOther]"
          : '[data-issue] [name="' + t.name + '"]';
      commit();
    }
  });
  root.addEventListener("input", (e) => {
    if (e.target.matches("[data-search]")) {
      s.search = e.target.value.slice(0, 60);
      const pos = e.target.selectionStart;
      s.focus = "[data-search]";
      commit();
      const el = q("[data-search]");
      if (el && pos != null) el.setSelectionRange(pos, pos);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    const key = e.key.toLowerCase();
    if (key === "/") {
      e.preventDefault();
      closeForms();
      s.tab = "Loan register";
      s.focus = "[data-lookup] input";
      commit("Type or scan the tag on the unit.");
    } else if (key === "n") {
      e.preventDefault();
      closeForms();
      s.tab = "Loan register";
      s.editing = true;
      s.draft = newDraft("");
      s.focus = "[data-issue] [name=req]";
      commit();
    } else if (key === "t") {
      e.preventDefault();
      closeForms();
      s.tab = "Today";
      s.focus = "[data-page] h2";
      commit();
    }
  });
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!(s.editing || s.adding || s.returning || s.stillOut || s.check || s.confirmRestart))
      return;
    closeForms();
    s.check = false;
    s.confirmRestart = false;
    s.focus = "[data-page] h2";
    commit("Closed without saving.");
  });

  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    s.confirmRestart = false;

    if (f.matches("[data-signin]")) {
      const who = String(form.get("staff") || "");
      if (!staffList.includes(who))
        return fail("Choose your name to sign in.", "[data-signin] select");
      s.staff = who;
      return commit(who + " is on the desk. Everything you record will show your name.", "ok");
    }
    // Looking things up is fine; changing records needs someone signed in.
    if (!f.matches("[data-lookup]") && !s.staff) return needStaff();

    if (f.matches("[data-lookup]")) {
      const raw = String(form.get("code") || "").trim();
      const code = normCode(raw);
      if (!code)
        return fail("Type the code printed on the unit’s tag.", "[data-lookup] input");
      const unit = getAsset(code);
      if (!unit)
        return fail(
          "No unit has the code “" + raw + "”. Codes look like AD-12 — check the tag on the item.",
          "[data-lookup] input",
        );
      if (!out(code)) {
        const same = openLoans().filter(
          (l) => getAsset(l.asset).type === unit.type,
        );
        return fail(
          code +
            " isn’t on loan — the records say it’s " +
            (inRepair(code) ? "in repair" : "on the shelf in bin " + unit.bin) +
            ". " +
            (same.length
              ? "Open " +
                unit.type +
                " slip" +
                (same.length > 1 ? "s" : "") +
                ": " +
                same
                  .map(
                    (l) =>
                      l.asset +
                      " (" +
                      getReq(l.req).club +
                      ", " +
                      (l.withWho || l.who) +
                      ")",
                  )
                  .join(", ") +
                ". Check the tag again before closing anything."
              : "Don’t close a slip for it."),
          "[data-lookup] input",
        );
      }
      openReturn(code);
      return commit();
    }

    if (f.matches("[data-return]")) {
      const l = out(f.dataset.asset);
      if (!l) {
        closeForms();
        return commit("That slip is already closed.", "error");
      }
      const by = canonName(form.get("by"));
      const cond = form.get("cond") === "damaged" ? "damaged" : "good";
      const note = String(form.get("note") || "").trim().slice(0, 120);
      if (!by) return fail("Enter who brought the unit in.", "[data-return] [name=by]");
      if (!nameOk(by))
        return fail(
          "Enter a full name — letters, spaces, hyphens and apostrophes only.",
          "[data-return] [name=by]",
        );
      if (cond === "damaged" && !note)
        return fail(
          "Describe what’s wrong so the workshop knows what to check.",
          "[data-return] [name=note]",
        );
      const a = getAsset(l.asset);
      const got = form.getAll("part").map(String);
      const missing = partsOf(l.asset).filter((pt) => !got.includes(pt));
      mutate("return of " + l.asset, () => {
        remember(by);
        l.missing = missing;
        l.back = true;
        l.returnedAt = now();
        l.returnedBy = by;
        l.condition = cond;
        l.condNote = note;
        if (cond === "damaged") s.repairs[l.asset] = "Returned damaged: " + note;
        l.log.push(
          entry(
            "Returned by " +
              by +
              (cond === "damaged"
                ? " · damaged: " + note + " · sent to repair"
                : " · good · back to bin " + a.bin) +
              (missing.length ? " · missing: " + missing.join(", ") : ""),
          ),
        );
      });
      s.returning = "";
      s.lastReq = l.req;
      s.focus = "[data-lookup] input";
      return commit(
        (cond === "damaged"
          ? l.asset + " sent to repair. Slip L-" + l.num + " closed."
          : l.asset + " goes back to bin " + a.bin + ". Slip L-" + l.num + " closed.") +
          (missing.length
            ? " Still to come back: " + missing.join(", ") + " — tracked on Today."
            : ""),
        missing.length ? "warn" : "ok",
      );
    }

    if (f.matches("[data-stillout]")) {
      const l = getLoan(f.dataset.num);
      const withWho = canonName(form.get("withWho")),
        expectedAt = fromParts(form.get("expectedDay"), form.get("expectedTime"));
      if (!l || l.back) {
        s.stillOut = 0;
        return commit("That slip is already closed.", "error");
      }
      if (!withWho)
        return fail("Enter who has the unit now.", "[data-stillout] [name=withWho]");
      if (!nameOk(withWho))
        return fail(
          "Enter a full name — letters, spaces, hyphens and apostrophes only.",
          "[data-stillout] [name=withWho]",
        );
      if (expectedAt === null)
        return fail(
          "Enter the day and time it’s expected back.",
          form.get("expectedDay")
            ? "[data-stillout] [name=expectedTime]"
            : "[data-stillout] [name=expectedDay]",
        );
      if (expectedAt <= now())
        return fail(
          "The expected time has to be after now (" + fmt(now()) + ").",
          "[data-stillout] [name=expectedTime]",
        );
      const expected = fmt(expectedAt);
      mutate("whereabouts on L-" + l.num, () => {
        remember(withWho);
        l.withWho = withWho;
        l.expected = expected;
        l.handoverNote = String(form.get("handoverNote") || "").trim().slice(0, 120);
        l.handoverAt = now();
        l.log.push(entry(heldBy(l) + "."));
      });
      s.stillOut = 0;
      return commit(
        "Saved on slip L-" + l.num + ". The next shift sees it on the slip, on Today and in the Desk book.",
        "ok",
      );
    }

    if (f.matches("[data-add]")) {
      const el = f.elements;
      const isNew = el.type.value === "__new";
      let type = isNew
        ? String(el.newType.value || "").trim().replace(/\s+/g, " ")
        : el.type.value;
      // A "new" type that already exists is the same type.
      type = types().find((x) => x.toLowerCase() === type.toLowerCase()) || type;
      const code = normCode(el.code.value);
      const model = String(el.model.value || "").trim().replace(/\s+/g, " ");
      const bin = String(el.bin.value || "").trim().toUpperCase();
      if (!type || type.length < 3)
        return fail("Name the new equipment type (at least 3 characters).", "[data-add] [name=newType]");
      if (!/^[A-Z]{2}-\d{2}$/.test(code))
        return fail("Tag codes are two letters and two digits, like TR-01.", "[data-add] [name=code]");
      if (getAsset(code))
        return fail(
          code + " is already " + getAsset(code).type + " (" + getAsset(code).model + "). Use " +
            (nextCode(code.slice(0, 2)) || "another code") + ".",
          "[data-add] [name=code]",
        );
      const owner = assets.find((a) => a.id.startsWith(code.slice(0, 2) + "-"));
      if (owner && owner.type !== type)
        return fail(
          code.slice(0, 2) + "- codes are for " + owner.type + ". " +
            (prefixOf(type) ? "Use " + nextCode(prefixOf(type)) + "." : "Pick an unused two-letter prefix."),
          "[data-add] [name=code]",
        );
      if (prefixOf(type) && prefixOf(type) !== code.slice(0, 2))
        return fail(
          type + " units use " + prefixOf(type) + "- codes. Use " + nextCode(prefixOf(type)) + ".",
          "[data-add] [name=code]",
        );
      if (model.length < 2)
        return fail("Enter the make and model printed on the unit.", "[data-add] [name=model]");
      if (!/^[A-Z0-9][A-Z0-9 -]{0,11}$/.test(bin))
        return fail("Enter the home bin, like D3.", "[data-add] [name=bin]");
      mutate("adding " + code, () => {
        s.added.push({ id: code, type, model, bin });
        syncLists();
      });
      s.adding = false;
      s.filter = "All items";
      s.search = code;
      const usable = requests.some((r) => r.items.includes(type));
      return commit(
        code + " · " + type + " added to bin " + bin + "." +
          (usable ? "" : " No approved request lists this type yet, so it can’t be issued until one does."),
        "ok",
      );
    }

    if (f.matches("[data-note]")) {
      const text = String(form.get("note") || "").trim().slice(0, 400);
      const ref = String(form.get("ref") || "");
      if (!text) return fail("Write the note first.", "[data-note] textarea");
      mutate("handover note", () =>
        s.notes.push({ at: now(), kind: "note", text, ref, by: s.staff }),
      );
      return commit("Handover note saved.", "ok");
    }

    if (!f.matches("[data-issue]") || !s.draft) return;
    // Pick up a name typed straight into the box without leaving it first.
    const before = JSON.stringify(s.draft);
    syncDraft(f, "");
    if (JSON.stringify(s.draft) !== before) paint();
    const d = s.draft;
    const r = getReq(d.req);
    if (!r) return fail("Choose the approved request first.", "[data-issue] [name=req]");
    if (lapsed(r)) return fail("This approval has ended. Nothing can be issued against it.");
    if (!d.who)
      return fail(
        d.other ? "Type the collector’s full name." : "Choose who is collecting.",
        d.other ? "[data-issue] [name=whoOther]" : "[data-issue] [name=who]",
      );
    if (!nameOk(d.who))
      return fail(
        "Enter the collector’s full name — letters, spaces, hyphens and apostrophes only.",
        "[data-issue] [name=whoOther]",
      );
    if (!authority(r, d.who) && !d.auth)
      return fail(
        "Confirm with " + r.owner + " that " + d.who + " may collect, or choose someone named on the request.",
        "[data-issue] [name=auth]",
      );
    const dueAtPicked = fromParts(d.dueDay, d.dueTime);
    if (dueAtPicked === null)
      return fail(
        "Enter the return day and time.",
        d.dueDay ? "[data-issue] [name=dueTime]" : "[data-issue] [name=dueDay]",
      );
    if (dueAtPicked <= now())
      return fail(
        "The return time has to be after now (" + fmt(now()) + ").",
        "[data-issue] [name=dueTime]",
      );
    if (dueAtPicked > dueAt(r.due))
      return fail(
        "The approved form says return by " +
          r.due +
          ". A later return needs a new approval from the Student Activities Office.",
        "[data-issue] [name=dueTime]",
      );
    d.due = fmt(dueAtPicked);
    const { picked, left } = issuable(d, r);
    if (!picked.length) return fail("Choose at least one unit to issue.");
    if (left.length && !d.partial)
      return fail(
        "The kit is incomplete. Tick “Issue a partial kit anyway” or pick the missing units.",
        "[data-issue] [name=partial]",
      );
    let num = Math.max(...s.loans.map((l) => l.num));
    const nums = [];
    mutate("issue of " + picked.join(", "), () => {
      remember(d.who);
      for (const id of picked) {
        num++;
        nums.push(num);
        s.loans.push({
          num,
          req: r.id,
          asset: id,
          who: d.who,
          due: d.due,
          back: false,
          issuedAt: now(),
          log: [
            {
              at: now(),
              by: s.staff,
              text:
                "Issued to " +
                d.who +
                ", return by " +
                d.due +
                "." +
                (authority(r, d.who)
                  ? ""
                  : " Collector confirmed with " + r.owner + " at the counter.") +
                (left.length ? " Kit left without: " + left.join(", ") + "." : ""),
            },
          ],
        });
      }
    });
    closeForms();
    s.focus = "[data-page] h2";
    commit(
      "Issued " +
        picked.join(", ") +
        " to " +
        d.who +
        " on slip" +
        (nums.length > 1 ? "s L-" + nums[0] + " to L-" + nums[nums.length - 1] : " L-" + nums[0]) +
        ". Return by " +
        d.due +
        ".",
      "ok",
    );
  });

  /* ------------------------------------------------------------------ */
  /* Saved progress                                                      */
  /* ------------------------------------------------------------------ */
  function valid(d) {
    const isStr = (x) => typeof x === "string";
    const isAt = (x) => Number.isInteger(x) && x >= 0 && x < maxAt;
    const isDue = (x) => Number.isFinite(dueAt(x));
    const refOk = (x) =>
      x === "" || !!getReq(x) || /^L-\d+$/.test(x);
    if (
      !d ||
      d.version !== 4 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) =>
          n &&
          isAt(n.at) &&
          isStr(n.text) &&
          (!n.ref || refOk(n.ref)) &&
          (n.lines === undefined ||
            (Array.isArray(n.lines) &&
              n.lines.every((x) => x && isStr(x.label) && Array.isArray(x.items) && x.items.every(isStr)))),
      ) ||
      !d.repairs ||
      typeof d.repairs !== "object" ||
      !Object.entries(d.repairs).every(([k, v]) => getAsset(k) && isStr(v)) ||
      !Array.isArray(d.fixed) ||
      !d.fixed.every((id) => getAsset(id)) ||
      !Array.isArray(d.loans) ||
      !d.loans.length
    )
      return false;
    const nums = new Set(),
      openAssets = new Set();
    for (const l of d.loans) {
      if (
        !l ||
        !getReq(l.req) ||
        !getAsset(l.asset) ||
        !Number.isInteger(l.num) ||
        nums.has(l.num) ||
        !isStr(l.who) ||
        !isDue(l.due) ||
        !isAt(l.issuedAt) ||
        !Array.isArray(l.log) ||
        !l.log.every((e) => e && isAt(e.at) && isStr(e.text)) ||
        (l.withWho !== undefined &&
          (!isStr(l.withWho) ||
            !isDue(l.expected) ||
            !isStr(l.handoverNote) ||
            !isAt(l.handoverAt))) ||
        (l.back && (!isAt(l.returnedAt) || !isStr(l.returnedBy))) ||
        (l.missing !== undefined &&
          (!Array.isArray(l.missing) || !l.missing.every(isStr)))
      )
        return false;
      nums.add(l.num);
      if (!l.back) {
        if (openAssets.has(l.asset)) return false;
        openAssets.add(l.asset);
      }
    }
    return true;
  }
  function validLists(d) {
    const ids = new Set(baseAssets.map((a) => a.id));
    return (
      Array.isArray(d.added) &&
      d.added.every((a) => {
        const ok =
          a &&
          /^[A-Z]{2}-\d{2}$/.test(a.id) &&
          !ids.has(a.id) &&
          typeof a.type === "string" &&
          typeof a.model === "string" &&
          typeof a.bin === "string" &&
          !a.repair;
        if (ok) ids.add(a.id);
        return ok;
      }) &&
      Array.isArray(d.extraPeople) &&
      d.extraPeople.every((n) => typeof n === "string" && n.length <= 60)
    );
  }
  function restore(d) {
    if (!d || !validLists(d)) return;
    // Check loans against the saved units and names, then roll back if invalid.
    const keep = { added: s.added, extraPeople: s.extraPeople };
    s.added = d.added;
    s.extraPeople = d.extraPeople;
    syncLists();
    if (!valid(d)) {
      Object.assign(s, keep);
      return syncLists();
    }
    s = {
      ...original(),
      tab: d.tab,
      phase: d.phase,
      selected: d.selected || "",
      filter: ["All items", "On shelf", "On loan", "In repair"].includes(d.filter)
        ? d.filter
        : "All items",
      search: isStrSafe(d.search),
      onlyOpen: d.onlyOpen !== false,
      loans: d.loans.map((l) => ({ ...l, log: l.log.slice() })),
      notes: d.notes.map((n) => ({ ...n })),
      repairs: { ...d.repairs },
      staff: staffList.includes(d.staff) ? d.staff : "",
      fixed: d.fixed.slice(),
      added: d.added.map((a) => ({ ...a })),
      extraPeople: d.extraPeople.slice(),
      notice: "Picked up where you left off.",
    };
    syncLists();
    paint();
  }
  const isStrSafe = (x) => (typeof x === "string" ? x.slice(0, 60) : "");
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
