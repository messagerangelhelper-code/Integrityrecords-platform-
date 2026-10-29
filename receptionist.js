/* CashCow chat receptionist: a free, scripted helper for cashcowai.online.
   It answers common questions about the apps, prices, All Access and hiring,
   and sends leads to your Gmail through the CashCow server (/api/leads).
   Add it to a page with:  <script src="receptionist.js" defer></script>

   Facebook ads: to count chat leads in Meta Ads Manager, paste your Meta Pixel ID
   below (Events Manager > Data sources > your pixel). Leave it empty to keep it off. */
(function () {
  "use strict";
  var META_PIXEL_ID = ""; // e.g. "123456789012345"
  var API = "https://cashcow-reviews-api.onrender.com/api/leads";

  if (window.__cashcowReceptionist) return;
  window.__cashcowReceptionist = true;

  // ---- What the receptionist knows ----
  var APPS = {
    scamshield: { name: "ScamShield", page: "scamshield.html", line: "checks messages, links, phone numbers and photos for scams, and helps you report them." },
    scamguard: { name: "ScamGuard Global", page: "scamguard.html", line: "is the same scam protection as ScamShield, in a bold red, white and blue look." },
    billpilot: { name: "MyBillPilot", page: "mybillpilot.html", line: "keeps every bill in one place, reminds you when it's due, and checks for fake bills. Premium from $4.99/month." },
    healthscan: { name: "My Health Check Scan", page: "myhealthcheckscan.html", line: "scans a food barcode and flags banned ingredients and allergens, with healthier options. Premium from $2.99/month." },
    remedies: { name: "My Home Kitchen Remedies", page: "myhomekitchenremedies.html", line: "has simple remedies from your kitchen, each with an honest evidence rating and safety checks. Premium from $1.99/month." },
    letters: { name: "My Letter Helper", page: "myletterhelper.html", line: "writes ready-to-send letters for billing disputes, refunds, cancellations, debt collectors and landlords. Premium from $1.99/month." },
    recalls: { name: "My Recall Check", page: "myrecallcheck.html", line: "checks your car, truck or motorcycle for safety recalls using official NHTSA data. Premium from $1.99/month." },
    caregiver: { name: "My Caregiver Circle", page: "mycaregivercircle.html", line: "gives the family caring for a loved one one shared plan: appointments and who's taking them, the medicine list, shared to-dos and an emergency care card. Premium from $2.99/month." },
  };

  var FIND = [
    ["A suspicious message or call", "scamshield"],
    ["Keeping up with bills", "billpilot"],
    ["What's in my food", "healthscan"],
    ["Feeling under the weather", "remedies"],
    ["Writing a letter to a company", "letters"],
    ["Recalls on my car", "recalls"],
    ["Caring for a parent or loved one", "caregiver"],
  ];

  var HELP = {
    signin: "Every CashCow app uses the same free CashCow account. On the app's sign-in card, tap \"Forgot your password?\" and we'll email you a link. Check your spam folder if it doesn't arrive in a few minutes.",
    premium: "Premium bought while signed in follows your CashCow account. Open the app, sign in with the same email you used to pay, and Premium turns on within a few seconds. Bought without signing in? It's saved on that phone and moves to your account the first time you sign in there.",
    billing: "We can help with cancelling or any billing question. Leave your details and the email you paid with, and we'll take care of it.",
    broken: "Sorry about that! Tell us which app, what you tapped, and what happened, and we'll look into it.",
  };

  // Words that route free typing to the right answer.
  var ROUTES = [
    [/\b(suicid\w*|kill (my ?self|myself)|self[- ]?harm|want to die)\b/i, "crisis"],
    [/\b(chest pain|can'?t breathe|overdos\w*|emergency|heart attack|stroke)\b/i, "emergency"],
    [/\b(scam\w*|fraud\w*|phish\w*|hack\w*|suspicious|weird (text|call|email|message)|gift cards?|wire (money|transfer)|is (this|it) (real|legit))\b|asking (me )?for (money|my)/i, "app:scamshield"],
    [/\b(caregiv\w*|caring for|care ?circle|aging parents?|elderly|my (mom|dad|mother|father|grandma|grandpa|parents?)|medicine list|medication list|doctor appointments?)\b/i, "app:caregiver"],
    [/\b(bill|bills|due date|payments?)\b/i, "app:billpilot"],
    [/\b(food|ingredient\w*|barcode|allerg\w*|label)\b/i, "app:healthscan"],
    [/\b(remed\w*|sick|cold|cough|sore throat|natural)\b/i, "app:remedies"],
    [/\b(letter|dispute|refund|debt collector|landlord|complain\w*)\b/i, "app:letters"],
    [/\b(recall\w*|car|truck|vehicle|vin)\b/i, "app:recalls"],
    [/\b(price|prices|pricing|cost|how much|premium|subscription)\b/i, "prices"],
    [/\b(all access|bundle|every app|membership)\b/i, "allaccess"],
    [/\b(build|hire|custom|develop\w*|my business|rebrand|white ?label|buy (an |the )?app)\b/i, "build"],
    [/\b(password|sign ?in|log ?in|account)\b/i, "help:signin"],
    [/\b(cancel|charged|refund my|billing)\b/i, "help:billing"],
    [/\b(broken|bug|error|not working|doesn'?t work|crash\w*)\b/i, "help:broken"],
    [/\b(community|forum|channel)\b/i, "community"],
    [/\b(hi|hello|hey|good (morning|afternoon|evening))\b/i, "start"],
  ];

  // ---- Styles ----
  var css = "" +
    ".ccr-btn{position:fixed;right:16px;bottom:16px;z-index:9998;display:flex;align-items:center;gap:8px;background:#1a1a1a;color:#fff;border:2px solid #D4A94D;border-radius:999px;padding:12px 18px;font:600 16px/1.2 -apple-system,'Segoe UI',Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer}" +
    ".ccr-btn:hover{background:#2a2a2a}.ccr-btn[hidden],.ccr-panel[hidden]{display:none}" +
    ".ccr-panel{position:fixed;right:16px;bottom:16px;z-index:9999;width:min(380px,calc(100vw - 32px));height:min(600px,calc(100vh - 32px));display:flex;flex-direction:column;background:#f5f4f0;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden;font:15px/1.5 -apple-system,'Segoe UI',Arial,sans-serif;color:#1f2937}" +
    ".ccr-head{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#1a1a1a;color:#fff;padding:12px 14px}" +
    ".ccr-head strong{font-size:16px}.ccr-head strong span{color:#D4A94D}.ccr-head small{display:block;color:#ccc;font-size:12px}" +
    ".ccr-x{background:none;border:0;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px}" +
    ".ccr-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}" +
    ".ccr-msg{max-width:88%;padding:10px 12px;border-radius:14px;white-space:pre-line;overflow-wrap:anywhere}" +
    ".ccr-bot{background:#fff;border:1px solid #e5e2da;align-self:flex-start;border-bottom-left-radius:4px}" +
    ".ccr-me{background:#3C3489;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}" +
    ".ccr-msg a{color:#3C3489;font-weight:600}.ccr-me a{color:#fff}" +
    ".ccr-alert{background:#fdecea;border-color:#b3261e}" +
    ".ccr-choices{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start}" +
    ".ccr-choice{background:#fff;border:2px solid #3C3489;color:#3C3489;border-radius:999px;padding:7px 12px;font:600 14px/1.2 -apple-system,'Segoe UI',Arial,sans-serif;cursor:pointer;text-align:left}" +
    ".ccr-choice:hover{background:#efedfb}" +
    ".ccr-form{display:flex;flex-direction:column;gap:6px;background:#fff;border:1px solid #e5e2da;border-radius:14px;padding:12px;align-self:stretch}" +
    ".ccr-form label{font-weight:600;font-size:13px}" +
    ".ccr-form input,.ccr-form textarea{font-family:inherit;font-size:15px;border:2px solid #ddd;border-radius:10px;padding:9px;width:100%;box-sizing:border-box}" +
    ".ccr-form input:focus,.ccr-form textarea:focus,.ccr-in input:focus{outline:3px solid #b9b3f0;border-color:#3C3489}" +
    ".ccr-send{background:#3C3489;color:#fff;border:0;border-radius:10px;padding:11px;font:700 15px/1 -apple-system,'Segoe UI',Arial,sans-serif;cursor:pointer;margin-top:4px}" +
    ".ccr-send:disabled{opacity:.6;cursor:default}" +
    ".ccr-note{font-size:12px;color:#666;margin:2px 0 0}" +
    ".ccr-err{color:#b3261e;font-size:13px;margin:2px 0 0}" +
    ".ccr-in{display:flex;gap:6px;padding:10px;border-top:1px solid #e5e2da;background:#fff}" +
    ".ccr-in input{flex:1;min-width:0;font-family:inherit;font-size:15px;border:2px solid #ddd;border-radius:10px;padding:10px}" +
    ".ccr-in button{background:#1a1a1a;color:#fff;border:0;border-radius:10px;padding:0 14px;font:700 15px/1 -apple-system,'Segoe UI',Arial,sans-serif;cursor:pointer}" +
    /* keep the site's own form styles out of the chat */
    ".ccr-panel form{max-width:none;margin:0}.ccr-panel form label{margin:6px 0 0;display:block}" +
    ".ccr-panel form textarea{min-height:0}.ccr-panel form .ccr-send{margin-top:8px;width:100%}" +
    ".ccr-in input{flex:1 1 auto;width:auto;margin:0}.ccr-panel .ccr-in button{flex:0 0 auto;width:auto;margin:0}";

  // ---- Small DOM helpers (all text goes in as text, never HTML) ----
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function link(text, href, external) {
    var a = el("a", null, text);
    a.href = href;
    if (external) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    return a;
  }

  var panel, log, input, opened = false;

  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function bot(parts, alert) {
    var m = el("div", "ccr-msg ccr-bot" + (alert ? " ccr-alert" : ""));
    (Array.isArray(parts) ? parts : [parts]).forEach(function (p) {
      m.appendChild(typeof p === "string" ? document.createTextNode(p) : p);
    });
    log.appendChild(m);
    scrollDown();
    return m;
  }
  function me(text) { log.appendChild(el("div", "ccr-msg ccr-me", text)); scrollDown(); }

  function choices(list) {
    var box = el("div", "ccr-choices");
    list.forEach(function (c) {
      var b = el("button", "ccr-choice", c[0]);
      b.type = "button";
      b.addEventListener("click", function () {
        box.remove();
        me(c[0]);
        c[1]();
      });
      box.appendChild(b);
    });
    log.appendChild(box);
    scrollDown();
  }

  function moreHelp() {
    choices([
      ["Something else", start],
      ["Leave a message", function () { leadForm("Message", "") }],
    ]);
  }

  // ---- Conversations ----
  function start() {
    bot("Hi! I'm the CashCow assistant. CashCow makes simple apps for everyday problems. What can I help you with?");
    choices([
      ["Find the right app", findApp],
      ["Prices & Premium", prices],
      ["CashCow All Access", allAccess],
      ["Build an app for my business", build],
      ["Help with an app", help],
      ["Leave a message", function () { leadForm("Message", "") }],
    ]);
  }

  function findApp() {
    bot("Sure! What would you like help with?");
    choices(FIND.map(function (f) { return [f[0], function () { showApp(f[1]) }]; }).concat([
      ["Something else", function () {
        bot("Tell us what you need. We're always looking for the next everyday problem to solve.");
        leadForm("App idea", "");
      }],
    ]));
  }

  function showApp(id) {
    var a = APPS[id];
    bot([a.name + " " + a.line + " ", link("See " + a.name, a.page)]);
    moreHelp();
  }

  function prices() {
    bot("Most features in every CashCow app are free. Premium adds extras, bought inside each app:\n\n" +
      "• MyBillPilot from $4.99/month\n• My Health Check Scan from $2.99/month\n• My Home Kitchen Remedies from $1.99/month\n" +
      "• My Letter Helper from $1.99/month\n• My Recall Check from $1.99/month\n• My Caregiver Circle from $2.99/month\n\n" +
      "Yearly and one-time lifetime plans save more. ScamShield and ScamGuard Global Premium are coming soon.");
    choices([["Tell me about All Access", allAccess], ["Something else", start]]);
  }

  function allAccess() {
    bot("CashCow All Access is coming soon: one membership that unlocks Premium in every CashCow app, including new ones as they launch. Want us to tell you when it opens?");
    choices([
      ["Yes, notify me", function () { leadForm("All Access", "Please notify me when CashCow All Access launches.", "allaccess", true) }],
      ["Something else", start],
    ]);
  }

  function build() {
    bot("CashCow builds custom apps, and any of our apps can be rebranded for your business with your name, colors and features. You can also buy an app outright. Tell us a little about what you have in mind and we'll get back to you, usually within one business day.");
    leadForm("Hire me", "");
  }

  function help() {
    bot("Sorry you're having trouble. What's going on?");
    choices([
      ["I can't sign in", function () { bot(HELP.signin); moreHelp(); }],
      ["My Premium isn't showing", function () { bot(HELP.premium); moreHelp(); }],
      ["Cancel or a billing question", function () { bot(HELP.billing); leadForm("Billing", ""); }],
      ["Something's not working", function () { bot(HELP.broken); leadForm("Help with an app", ""); }],
    ]);
  }

  function community() {
    bot(["Join the free CashCow Community to swap tips with other members: ", link("Open the community", "community.html")]);
    moreHelp();
  }

  // ---- Lead form ----
  function leadForm(topic, preset, source, short) {
    var f = el("form", "ccr-form");
    f.noValidate = true;
    var fields = [
      ["name", "Your name", "text", "name"],
      ["email", "Your email", "email", "email"],
    ];
    if (!short) fields.push(["phone", "Phone (optional)", "tel", "tel"]);
    fields.forEach(function (d) {
      var id = "ccr-" + d[0] + "-" + Date.now();
      var l = el("label", null, d[1]);
      l.htmlFor = id;
      var i = el("input");
      i.id = id; i.name = d[0]; i.type = d[2]; i.autocomplete = d[3]; i.maxLength = d[0] === "email" ? 120 : 80;
      f.appendChild(l); f.appendChild(i);
    });
    var msgId = "ccr-msg-" + Date.now();
    if (!short) {
      var ml = el("label", null, "How can we help?");
      ml.htmlFor = msgId;
      var t = el("textarea");
      t.id = msgId; t.name = "message"; t.rows = 3; t.maxLength = 1500; t.value = preset || "";
      f.appendChild(ml); f.appendChild(t);
    }
    var send = el("button", "ccr-send", short ? "Notify me" : "Send");
    send.type = "submit";
    var err = el("p", "ccr-err");
    err.setAttribute("role", "alert");
    f.appendChild(send);
    f.appendChild(err);
    f.appendChild(el("p", "ccr-note", "Sent by email to the CashCow team. We only use it to reply to you."));

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      err.textContent = "";
      var name = f.elements.name.value.trim();
      var email = f.elements.email.value.trim();
      var phone = f.elements.phone ? f.elements.phone.value.trim() : "";
      var message = f.elements.message ? f.elements.message.value.trim() : preset;
      if (!name) { err.textContent = "Please add your name."; return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = "Please add a valid email so we can reply."; return; }
      if (!message) { err.textContent = "Please tell us how we can help."; return; }
      if (/[<>]/.test(name + message + phone)) { err.textContent = "Please remove the < and > characters."; return; }
      send.disabled = true;
      send.textContent = "Sending…";
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email, phone: phone, message: message, source: source || "chat", topic: topic }),
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { return { ok: res.ok, d: d }; }); })
        .then(function (r) {
          if (!r.ok || r.d.success === false) throw new Error();
          f.remove();
          bot(short
            ? "Thanks, " + name + "! You're on the list. We'll email you when All Access opens."
            : "Thanks, " + name + "! We got your message and will get back to you, usually within one business day.");
          if (window.fbq) window.fbq("track", "Lead", { content_name: topic });
          moreHelp();
        })
        .catch(function () {
          send.disabled = false;
          send.textContent = short ? "Notify me" : "Send";
          err.textContent = "Couldn't send that right now. Please try again in a minute.";
        });
    });
    log.appendChild(f);
    scrollDown();
    var first = f.querySelector("input");
    if (first) first.focus();
  }

  // ---- Free typing ----
  function answer(text) {
    var route = "";
    for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i][0].test(text)) { route = ROUTES[i][1]; break; }
    if (route === "crisis") {
      bot(["You don't have to go through this alone. Please call or text ", link("988", "tel:988"), " to reach the Suicide & Crisis Lifeline, free and open 24 hours. If you're in danger right now, call ", link("911", "tel:911"), "."], true);
      return;
    }
    if (route === "emergency") {
      bot(["This sounds like an emergency. Please call ", link("911", "tel:911"), " now."], true);
      return;
    }
    if (route.indexOf("app:") === 0) return showApp(route.slice(4));
    if (route.indexOf("help:") === 0) {
      var k = route.slice(5);
      bot(HELP[k]);
      if (k === "billing" || k === "broken") return leadForm(k === "billing" ? "Billing" : "Help with an app", text);
      return moreHelp();
    }
    var go = { prices: prices, allaccess: allAccess, build: build, community: community, start: start }[route];
    if (go) return go();
    bot("I'm not sure about that one, but the CashCow team can help. Leave your details and we'll get back to you.");
    leadForm("Question", text);
  }

  // ---- Open / close ----
  function open() {
    if (!panel) build_panel();
    panel.hidden = false;
    btn.hidden = true;
    if (!opened) { opened = true; start(); }
    input.focus();
  }
  function close() { panel.hidden = true; btn.hidden = false; btn.focus(); }

  function build_panel() {
    panel = el("div", "ccr-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "CashCow assistant");
    var head = el("div", "ccr-head");
    var title = el("div");
    var strong = el("strong", null, "Cash");
    strong.appendChild(el("span", null, "Cow"));
    strong.appendChild(document.createTextNode(" assistant"));
    title.appendChild(strong);
    title.appendChild(el("small", null, "Answers about our apps · leave a message anytime"));
    var x = el("button", "ccr-x", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Close chat");
    x.addEventListener("click", close);
    head.appendChild(title);
    head.appendChild(x);
    log = el("div", "ccr-log");
    log.setAttribute("aria-live", "polite");
    var form = el("form", "ccr-in");
    input = el("input");
    input.type = "text";
    input.placeholder = "Type a question…";
    input.maxLength = 300;
    input.setAttribute("aria-label", "Type a question");
    var go = el("button", null, "Send");
    go.type = "submit";
    form.appendChild(input);
    form.appendChild(go);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = input.value.trim();
      if (!t) return;
      input.value = "";
      me(t);
      answer(t);
    });
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(form);
    document.body.appendChild(panel);
  }

  // ---- Meta Pixel (only when an ID is set above) ----
  function loadPixel(id) {
    /* Meta's standard pixel loader */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", id);
    window.fbq("track", "PageView");
  }

  // ---- Start ----
  var style = el("style");
  style.textContent = css;
  document.head.appendChild(style);
  var btn = el("button", "ccr-btn");
  btn.type = "button";
  btn.setAttribute("aria-label", "Chat with the CashCow assistant");
  btn.appendChild(el("span", null, "💬"));
  btn.appendChild(el("span", null, "Questions? Chat with us"));
  btn.addEventListener("click", open);
  document.body.appendChild(btn);
  if (/^\d{6,20}$/.test(META_PIXEL_ID)) loadPixel(META_PIXEL_ID);
})();
