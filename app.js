"use strict";

/*
=========================================================
REDPAY — APP.JS
Frontend demo application logic

IMPORTANT:
This is a frontend demo.
It does NOT process real money or real bank transfers.
=========================================================
*/


/* =========================================================
   STORAGE KEYS
========================================================= */

const REDPAY_KEYS = {
  user: "redpayUser",
  balance: "redpayBalance",
  transactions: "redpayTransactions",
  loggedIn: "redpayLoggedIn",
  rememberedEmail: "redpayRememberedEmail",
  lastLogin: "redpayLastLogin",
  accountNumber: "redpayAccountNumber",
  accountCreated: "redpayAccountCreated"
};


/* =========================================================
   STORAGE HELPERS
========================================================= */

function getStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return value;
  } catch (error) {
    console.error("RedPay storage error:", error);
    return fallback;
  }
}


function setStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error("RedPay storage error:", error);
    return false;
  }
}


function removeStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("RedPay storage error:", error);
    return false;
  }
}


function getJSON(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error("RedPay JSON error:", error);
    return fallback;
  }
}


function setJSON(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;
  } catch (error) {
    console.error("RedPay JSON error:", error);
    return false;
  }
}


/* =========================================================
   USER
========================================================= */

function getUser() {
  return getJSON(
    REDPAY_KEYS.user,
    null
  );
}


function saveUser(user) {
  return setJSON(
    REDPAY_KEYS.user,
    user
  );
}


function isLoggedIn() {
  return (
    getStorage(
      REDPAY_KEYS.loggedIn,
      "false"
    ) === "true"
  );
}


/* =========================================================
   AUTHENTICATION
========================================================= */

function loginUser() {
  setStorage(
    REDPAY_KEYS.loggedIn,
    "true"
  );

  setStorage(
    REDPAY_KEYS.lastLogin,
    new Date().toISOString()
  );
}


function logoutUser() {

  removeStorage(
    REDPAY_KEYS.loggedIn
  );

  window.location.href = "login.html";
}


/* =========================================================
   PAGE DETECTION
========================================================= */

function getCurrentPage() {

  const path =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

  return path || "index.html";
}


const currentPage = getCurrentPage();


/* =========================================================
   PUBLIC / PROTECTED PAGES
========================================================= */

const publicPages = [
  "",
  "index.html",
  "login.html",
  "register.html"
];


const protectedPages = [
  "dashboard.html",
  "withdraw.html",
  "history.html",
  "profile.html"
];


/*
Protect dashboard pages.

The public pages remain accessible
without an account.
*/

if (
  protectedPages.includes(currentPage) &&
  !isLoggedIn()
) {

  window.location.replace(
    "login.html"
  );
}


/* =========================================================
   MONEY
========================================================= */

function getBalance() {

  const balance = parseFloat(
    getStorage(
      REDPAY_KEYS.balance,
      "0"
    )
  );

  return Number.isFinite(balance)
    ? balance
    : 0;
}


function setBalance(amount) {

  const safeAmount =
    Number(amount);

  if (!Number.isFinite(safeAmount)) {
    return false;
  }

  return setStorage(
    REDPAY_KEYS.balance,
    safeAmount.toFixed(2)
  );
}


function addBalance(amount) {

  const value =
    Number(amount);

  if (!Number.isFinite(value) || value < 0) {
    return false;
  }

  return setBalance(
    getBalance() + value
  );
}


function subtractBalance(amount) {

  const value =
    Number(amount);

  if (!Number.isFinite(value) || value < 0) {
    return false;
  }

  const current =
    getBalance();

  if (value > current) {
    return false;
  }

  return setBalance(
    current - value
  );
}


/* =========================================================
   MONEY FORMATTER
========================================================= */

function formatMoney(amount) {

  const value =
    Number(amount) || 0;

  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2
    }
  ).format(value);
}


/* =========================================================
   TRANSACTIONS
========================================================= */

function getTransactions() {

  const transactions =
    getJSON(
      REDPAY_KEYS.transactions,
      []
    );

  return Array.isArray(transactions)
    ? transactions
    : [];
}


function saveTransactions(transactions) {

  return setJSON(
    REDPAY_KEYS.transactions,
    Array.isArray(transactions)
      ? transactions
      : []
  );
}


function addTransaction(transaction) {

  if (
    !transaction ||
    typeof transaction !== "object"
  ) {
    return false;
  }

  const transactions =
    getTransactions();

  const newTransaction = {
    id:
      transaction.id ||
      "TX" + Date.now(),

    type:
      transaction.type ||
      "transaction",

    amount:
      Number(transaction.amount) || 0,

    status:
      transaction.status ||
      "completed",

    date:
      transaction.date ||
      new Date().toLocaleString("en-NG"),

    ...transaction
  };

  transactions.unshift(
    newTransaction
  );

  return saveTransactions(
    transactions
  );
}


/* =========================================================
   TRANSACTION TYPE
========================================================= */

function normalizeTransactionType(type) {

  const value =
    String(type || "")
      .toLowerCase()
      .trim();

  if (
    value === "withdraw" ||
    value === "withdrawal"
  ) {
    return "withdrawal";
  }

  if (
    value === "deposit" ||
    value === "credit"
  ) {
    return "deposit";
  }

  return value;
}


/* =========================================================
   TRANSACTION TOTALS
========================================================= */

function getTransactionTotals() {

  const transactions =
    getTransactions();

  let deposits = 0;
  let withdrawals = 0;

  transactions.forEach(
    transaction => {

      const amount =
        Number(transaction.amount) || 0;

      const type =
        normalizeTransactionType(
          transaction.type
        );

      if (type === "deposit") {
        deposits += amount;
      }

      if (type === "withdrawal") {
        withdrawals += amount;
      }
    }
  );

  return {
    deposits,
    withdrawals,
    total:
      transactions.length
  };
}


/* =========================================================
   ACCOUNT NUMBER
========================================================= */

function generateAccountNumber() {

  let number = "";

  for (let i = 0; i < 10; i++) {
    number += Math.floor(
      Math.random() * 10
    );
  }

  return number;
}


function getAccountNumber() {

  let accountNumber =
    getStorage(
      REDPAY_KEYS.accountNumber,
      ""
    );

  if (!accountNumber) {

    accountNumber =
      generateAccountNumber();

    setStorage(
      REDPAY_KEYS.accountNumber,
      accountNumber
    );
  }

  return accountNumber;
}


/* =========================================================
   ACCOUNT MASKING
========================================================= */

function maskAccountNumber(
  accountNumber
) {

  const value =
    String(accountNumber || "");

  if (value.length <= 4) {
    return value;
  }

  return (
    "**** **** " +
    value.slice(-4)
  );
}


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(dateValue) {

  if (!dateValue) {
    return "—";
  }

  const date =
    new Date(dateValue);

  if (Number.isNaN(
    date.getTime()
  )) {
    return String(dateValue);
  }

  return date.toLocaleDateString(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}


/* =========================================================
   USER INITIALS
========================================================= */

function getInitials(name) {

  const value =
    String(name || "")
      .trim();

  if (!value) {
    return "R";
  }

  const parts =
    value.split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(
      String(email || "")
        .trim()
    );
}


/* =========================================================
   PHONE VALIDATION
========================================================= */

function normalizePhone(phone) {

  return String(phone || "")
    .replace(
      /[\s\-()]/g,
      ""
    );
}


function isValidPhone(phone) {

  const value =
    normalizePhone(phone);

  return /^(\+234|0)[0-9]{10}$/
    .test(value);
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   NOTICE
========================================================= */

function showNotice(
  message,
  type = "info"
) {

  const existing =
    document.querySelector(
      ".redpay-global-notice"
    );

  if (existing) {
    existing.remove();
  }

  const notice =
    document.createElement("div");

  notice.className =
    "redpay-global-notice " + type;

  notice.textContent =
    message;

  Object.assign(
    notice.style,
    {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "99999",
      maxWidth: "90%",
      padding: "13px 18px",
      borderRadius: "10px",
      background: "#171717",
      border: "1px solid rgba(255,255,255,.1)",
      color: "#fff",
      fontSize: "13px",
      boxShadow: "0 15px 40px rgba(0,0,0,.4)"
    }
  );

  if (type === "success") {
    notice.style.borderColor =
      "rgba(32,199,122,.4)";
  }

  if (type === "error") {
    notice.style.borderColor =
      "rgba(229,9,20,.5)";
  }

  document.body.appendChild(
    notice
  );

  setTimeout(() => {

    notice.style.opacity = "0";
    notice.style.transition =
      "opacity .3s ease";

    setTimeout(
      () => notice.remove(),
      300
    );

  }, 3000);
}


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-logout], .logout-button"
      );

    if (!button) {
      return;
    }

    event.preventDefault();

    logoutUser();
  }
);


/* =========================================================
   CURRENT USER DISPLAY
========================================================= */

function populateUserElements() {

  const user =
    getUser();

  if (!user) {
    return;
  }

  const name =
    user.fullName ||
    user.name ||
    "RedPay User";

  const email =
    user.email ||
    "";

  const phone =
    user.phone ||
    "";

  const accountNumber =
    user.accountNumber ||
    getAccountNumber();


  document
    .querySelectorAll(
      "#userName, #profileName, #displayName, [data-user-name]"
    )
    .forEach(element => {

      element.textContent =
        name;
    });


  document
    .querySelectorAll(
      "#profileEmail, #displayEmail, [data-user-email]"
    )
    .forEach(element => {

      element.textContent =
        email;
    });


  document
    .querySelectorAll(
      "#profilePhone, [data-user-phone]"
    )
    .forEach(element => {

      element.textContent =
        phone;
    });


  document
    .querySelectorAll(
      "#accountNumber, #summaryAccountNumber, [data-account-number]"
    )
    .forEach(element => {

      element.textContent =
        accountNumber;
    });


  document
    .querySelectorAll(
      "#profileAvatar, [data-user-avatar]"
    )
    .forEach(element => {

      element.textContent =
        getInitials(name);
    });
}


/* =========================================================
   DASHBOARD BALANCE DISPLAY
========================================================= */

function populateBalanceElements() {

  const balance =
    getBalance();

  document
    .querySelectorAll(
      "#balance, #summaryBalance, [data-balance]"
    )
    .forEach(element => {

      element.textContent =
        formatMoney(balance);
    });
}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function populateStatistics() {

  const totals =
    getTransactionTotals();


  document
    .querySelectorAll(
      "#totalDeposits, [data-total-deposits]"
    )
    .forEach(element => {

      element.textContent =
        formatMoney(
          totals.deposits
        );
    });


  document
    .querySelectorAll(
      "#totalWithdrawals, [data-total-withdrawals]"
    )
    .forEach(element => {

      element.textContent =
        formatMoney(
          totals.withdrawals
        );
    });


  document
    .querySelectorAll(
      "#totalTransactions, [data-total-transactions]"
    )
    .forEach(element => {

      element.textContent =
        String(
          totals.total
        );
    });
}


/* =========================================================
   ACTIVE MOBILE NAV
========================================================= */

function setupMobileNavigation() {

  const links =
    document.querySelectorAll(
      ".bottom-nav-item"
    );

  links.forEach(link => {

    const href =
      link.getAttribute("href");

    if (!href) {
      return;
    }

    const filename =
      href
        .split("/")
        .pop()
        .toLowerCase();

    if (
      filename === currentPage
    ) {
      link.classList.add(
        "active"
      );
    }
  });
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    populateUserElements();

    populateBalanceElements();

    populateStatistics();

    setupMobileNavigation();

    console.log(
      "RedPay app initialized."
    );
  }
);


/* =========================================================
   EXPOSE REDPAY API
========================================================= */

window.RedPay = {

  /* Storage */
  getStorage,
  setStorage,
  removeStorage,

  getJSON,
  setJSON,

  /* User */
  getUser,
  saveUser,

  /* Auth */
  isLoggedIn,
  loginUser,
  logoutUser,

  /* Money */
  getBalance,
  setBalance,
  addBalance,
  subtractBalance,
  formatMoney,

  /* Transactions */
  getTransactions,
  saveTransactions,
  addTransaction,
  getTransactionTotals,
  normalizeTransactionType,

  /* Account */
  getAccountNumber,
  generateAccountNumber,
  maskAccountNumber,

  /* Helpers */
  formatDate,
  getInitials,
  isValidEmail,
  normalizePhone,
  isValidPhone,
  escapeHTML,
  showNotice
};
