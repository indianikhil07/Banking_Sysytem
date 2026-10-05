"use strict";

/* ---------- OOP core (converted from banking_system_fixed.py) ---------- */

class Account {
  #password;
  #balance;

  constructor(name, password, balance) {
    this.name = name;
    this.#password = String(password);
    this.#balance = Number(balance);
  }

  get balance() {
    return this.#balance;
  }

  checkPassword(password) {
    return String(password) === this.#password;
  }

  deposit(amount) {
    this.#balance += amount;
  }

  withdraw(amount) {
    if (amount > this.#balance) return false;
    this.#balance -= amount;
    return true;
  }

  toJSON() {
    return { name: this.name, password: this.#password, balance: this.#balance };
  }

  static fromJSON(data) {
    return new Account(data.name, data.password, data.balance);
  }
}

class Bank {
  static MAX_ATTEMPTS = 3;
  static LOCK_SECONDS = 5;
  static STORAGE_KEY = "bank-demo-accounts";

  #accounts = new Map(); // name -> Account
  #attempts = new Map(); // name -> { count, lockedUntil }
  #managerCode = "234";

  constructor() {
    this.#load();
  }

  /* ----- persistence (browser only, demo purposes) ----- */
  #load() {
    try {
      const raw = localStorage.getItem(Bank.STORAGE_KEY);
      if (!raw) return;
      JSON.parse(raw).forEach((d) => this.#accounts.set(d.name, Account.fromJSON(d)));
    } catch (e) {
      /* storage unavailable: run in memory only */
    }
  }

  #save() {
    try {
      localStorage.setItem(
        Bank.STORAGE_KEY,
        JSON.stringify([...this.#accounts.values()])
      );
    } catch (e) {
      /* ignore */
    }
  }

  /* ----- password check with lockout (replaces the self.f counter) ----- */
  #authenticate(name, password) {
    const account = this.#accounts.get(name);
    if (!account) return { ok: false, message: "You do not have an account in the bank." };

    const state = this.#attempts.get(name) || { count: 0, lockedUntil: 0 };
    const now = Date.now();

    if (state.lockedUntil > now) {
      const secs = Math.ceil((state.lockedUntil - now) / 1000);
      return { ok: false, message: `Too many wrong attempts. Try again in ${secs} sec.` };
    }
    if (state.lockedUntil && state.lockedUntil <= now) {
      state.count = 0;
      state.lockedUntil = 0;
    }

    if (account.checkPassword(password)) {
      this.#attempts.delete(name);
      return { ok: true, account };
    }

    state.count += 1;
    if (state.count >= Bank.MAX_ATTEMPTS) {
      state.lockedUntil = now + Bank.LOCK_SECONDS * 1000;
      this.#attempts.set(name, state);
      return {
        ok: false,
        message: `Invalid password. Account locked for ${Bank.LOCK_SECONDS} seconds.`,
      };
    }
    this.#attempts.set(name, state);
    return {
      ok: false,
      message: `Invalid password. ${Bank.MAX_ATTEMPTS - state.count} attempt(s) left.`,
    };
  }

  /* ----- customer operations ----- */
  registration(name, password, openingBalance) {
    if (!name || !password) return { ok: false, message: "Name and password are required." };
    if (!Number.isFinite(openingBalance) || openingBalance < 0)
      return { ok: false, message: "Enter a valid opening balance." };
    if (this.#accounts.has(name)) return { ok: false, message: "Account is already opened." };

    this.#accounts.set(name, new Account(name, password, openingBalance));
    this.#save();
    return {
      ok: true,
      message: `Account opened successfully, thank you for using our service. ${new Date().toString()}`,
    };
  }

  deposit(name, password, amount) {
    const auth = this.#authenticate(name, password);
    if (!auth.ok) return auth;
    if (!Number.isFinite(amount) || amount <= 0)
      return { ok: false, message: "Enter a valid amount." };

    auth.account.deposit(amount);
    this.#save();
    return {
      ok: true,
      message: `Amount added, thank you for using our service. ${new Date().toString()}`,
    };
  }

  withdrawal(name, password, amount) {
    const auth = this.#authenticate(name, password);
    if (!auth.ok) return auth;
    if (!Number.isFinite(amount) || amount <= 0)
      return { ok: false, message: "Enter a valid amount." };

    if (!auth.account.withdraw(amount))
      return { ok: false, message: "You do not have sufficient balance." };

    this.#save();
    return {
      ok: true,
      message: `Amount withdrawn, thank you for using our service. ${new Date().toString()}`,
    };
  }

  display(name, password) {
    const auth = this.#authenticate(name, password);
    if (!auth.ok) return auth;
    return {
      ok: true,
      message: `${name}, your balance is ${auth.account.balance.toFixed(2)}. ${new Date().toString()}`,
    };
  }

  /* ----- manager operations ----- */
  checkManager(code) {
    return String(code) === this.#managerCode;
  }

  totalAccount() {
    return { count: this.#accounts.size, time: new Date().toString() };
  }

  displayWhole() {
    return [...this.#accounts.values()].map((a) => ({ name: a.name, balance: a.balance }));
  }
}

/* ---------- UI ---------- */

const bank = new Bank();
const $ = (id) => document.getElementById(id);

const modeButtons = document.querySelectorAll("[data-mode]");
const actionButtons = document.querySelectorAll("[data-action]");
const customerPanel = $("customer-panel");
const managerPanel = $("manager-panel");
const form = $("bank-form");
const amountField = $("amount-field");
const amountLabel = $("amount-label");
const passwordInput = $("password");
const amountInput = $("amount");
const message = $("message");

let currentAction = "register";

function showMessage(text, ok) {
  message.textContent = text;
  message.className = "message " + (ok ? "ok" : "error");
}

function clearMessage() {
  message.textContent = "";
  message.className = "message";
}

function setAction(action) {
  currentAction = action;
  actionButtons.forEach((b) => b.classList.toggle("active", b.dataset.action === action));
  const needsAmount = action !== "display";
  amountField.hidden = !needsAmount;
  amountInput.required = needsAmount;
  amountLabel.textContent = action === "register" ? "Opening balance" : "Amount";
  clearMessage();
}

function setMode(mode) {
  modeButtons.forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  customerPanel.hidden = mode !== "customer";
  managerPanel.hidden = mode !== "manager";
  clearMessage();
}

modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
actionButtons.forEach((b) => b.addEventListener("click", () => setAction(b.dataset.action)));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("name").value.trim();
  const password = passwordInput.value;
  const amount = parseFloat(amountInput.value);
  let result;

  switch (currentAction) {
    case "register":
      result = bank.registration(name, password, amount);
      break;
    case "deposit":
      result = bank.deposit(name, password, amount);
      break;
    case "withdraw":
      result = bank.withdrawal(name, password, amount);
      break;
    default:
      result = bank.display(name, password);
  }

  showMessage(result.message, result.ok);
  passwordInput.value = "";
  if (result.ok) amountInput.value = "";
});

/* Manager */
const managerForm = $("manager-form");
const managerOutput = $("manager-output");

managerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  managerOutput.replaceChildren();

  if (!bank.checkManager($("manager-code").value)) {
    showMessage("Invalid manager code.", false);
    return;
  }
  clearMessage();

  const total = bank.totalAccount();
  const summary = document.createElement("p");
  summary.textContent = `Total accounts: ${total.count} (${total.time})`;
  managerOutput.appendChild(summary);

  const accounts = bank.displayWhole();
  if (accounts.length === 0) return;

  const table = document.createElement("table");
  const head = table.createTHead().insertRow();
  ["Name", "Balance"].forEach((t) => {
    const th = document.createElement("th");
    th.textContent = t;
    head.appendChild(th);
  });
  const body = table.createTBody();
  accounts.forEach((a) => {
    const row = body.insertRow();
    row.insertCell().textContent = a.name;
    row.insertCell().textContent = a.balance.toFixed(2);
  });
  managerOutput.appendChild(table);
});

setMode("customer");
setAction("register");
