async function renderShell(activePage) {
  const shell = document.getElementById("app-shell");
  if (!shell) return;

  const user = await getCurrentUser();
  const isCompany = user.role === "company";

  const navItems = [
    { key: "dashboard", label: "داشبورد", href: "dashboard.html", icon: "📊" },
    { key: "jobs", label: "آگهی‌های شغلی", href: "jobs.html", icon: "💼" },
    { key: "applications", label: isCompany ? "درخواست‌های دریافتی" : "درخواست‌های من", href: "applications.html", icon: "📄" },
    { key: "profile", label: "پروفایل", href: "profile.html", icon: "👤" },
    { key: "change-password", label: "تغییر رمز عبور", href: "change-password.html", icon: "🔒" },
  ];

  const navHtml = navItems
    .map(
      (item) => `
      <a class="nav-link ${item.key === activePage ? "active" : ""}" href="${item.href}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>`
    )
    .join("");

  shell.innerHTML = `
    <aside class="sidebar">
      <div class="brand">سامانه کاریابی</div>
      <nav class="nav">${navHtml}</nav>
      <button class="btn btn-ghost logout-btn" id="logout-btn">خروج از حساب</button>
    </aside>
    <div class="main-area">
      <header class="topbar">
        <div>
          <div class="topbar-user">${user.username} — ${isCompany ? "حساب شرکتی" : "حساب کارجو"}</div>
        </div>
      </header>
      <main class="content" id="page-content"></main>
    </div>
  `;

  document.getElementById("logout-btn").addEventListener("click", logout);
  return user;
}

function showAlert(containerId, message, type = "error") {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function clearAlert(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = "";
}


const STATUS_MAP = {

  draft: { label: "پیش‌نویس", className: "badge-gray" },
  published: { label: "منتشرشده", className: "badge-green" },
  closed: { label: "بسته‌شده", className: "badge-red" },

  pending: { label: "در انتظار بررسی", className: "badge-amber" },
  reviewed: { label: "بررسی‌شده", className: "badge-blue" },
  shortlisted: { label: "لیست نهایی", className: "badge-teal" },
  rejected: { label: "رد شده", className: "badge-red" },
  accepted: { label: "پذیرفته‌شده", className: "badge-green" },
  withdrawn: { label: "انصراف داده‌شده", className: "badge-gray" },
};


function renderBadge(status) {
  const info = STATUS_MAP[status] || { label: status, className: "badge-gray" };
  return `<span class="badge ${info.className}">${info.label}</span>`;
}

const JOB_TYPE_LABELS = {
  full_time: "تمام‌وقت",
  part_time: "پاره‌وقت",
  contract: "قراردادی",
  internship: "کارآموزی",
  remote: "دورکاری",
};

const EXPERIENCE_LABELS = {
  entry: "مبتدی",
  mid: "میان‌رده",
  senior: "ارشد",
  manager: "مدیریتی",
};


function formatDate(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleDateString("fa-IR");
}


function setButtonLoading(button, isLoading, loadingText = "در حال ارسال...") {
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}


function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const COMMON_WEAK_PASSWORDS = [
  "123456", "password", "12345678", "123456789", "12345",
  "qwerty", "abc123", "111111", "123123", "admin", "letmein",
  "welcome", "monkey", "1234567", "iloveyou", "000000",
  "password1", "qwerty123", "1q2w3e4r",
];


function getPasswordChecklist(value) {
  return {
    minLength: value.length >= 8,
    notAllNumeric: value.length > 0 && !/^\d+$/.test(value),
    notCommon: value.length > 0 && !COMMON_WEAK_PASSWORDS.includes(value.toLowerCase()),
  };
}


function getPasswordScore(value) {
  if (!value) return 0;
  const checklist = getPasswordChecklist(value);
  if (!checklist.minLength || !checklist.notAllNumeric || !checklist.notCommon) {
    return 0;
  }
  let score = 1;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(score, 4);
}

function getStrengthLabel(score) {
  if (score <= 1) return { text: "ضعیف", className: "pw-weak" };
  if (score <= 2) return { text: "متوسط", className: "pw-medium" };
  return { text: "قوی", className: "pw-strong" };
}


function renderPasswordStrengthBox(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="pw-strength-wrapper">
      <div class="pw-strength-bar">
        <div class="pw-strength-fill" id="${containerId}-fill"></div>
      </div>
      <div class="pw-strength-label" id="${containerId}-label">قدرت رمز عبور را با تایپ‌کردن ببینید</div>
    </div>
    <ul class="pw-checklist" id="${containerId}-checklist">
      <li data-check="minLength">حداقل ۸ کاراکتر</li>
      <li data-check="notAllNumeric">فقط عدد نباشد</li>
    </ul>
  `;
}

/**
 * @param {string} passwordInputId  
 * @param {string} containerId  
 */
function attachPasswordStrengthMeter(passwordInputId, containerId) {
  const input = document.getElementById(passwordInputId);
  if (!input) return;

  input.addEventListener("input", () => {
    const value = input.value;
    const score = getPasswordScore(value);
    const { text, className } = getStrengthLabel(score);
    const checklist = getPasswordChecklist(value);

    const fill = document.getElementById(`${containerId}-fill`);
    const label = document.getElementById(`${containerId}-label`);
    const checklistEl = document.getElementById(`${containerId}-checklist`);

    if (fill) {
      fill.className = "pw-strength-fill " + (value ? className : "");
      fill.style.width = value ? `${(score / 4) * 100}%` : "0%";
    }
    if (label) {
      label.textContent = value ? `قدرت رمز عبور: ${text}` : "قدرت رمز عبور را با تایپ‌کردن ببینید";
      label.className = "pw-strength-label " + (value ? className : "");
    }
    if (checklistEl) {
      checklistEl.querySelectorAll("li").forEach((li) => {
        const key = li.dataset.check;
        const passed = checklist[key];
        li.classList.toggle("pw-check-valid", !!passed);
        li.classList.toggle("pw-check-invalid", !passed);
      });
    }
  });
}


/**
 * @param {Array<{value: string, message: string}>} rules
 * @returns {string|null} 
 */
function validateRequired(rules) {
  for (const rule of rules) {
    const value = typeof rule.value === "string" ? rule.value.trim() : rule.value;
    if (!value) return rule.message;
  }
  return null;
}


function toPersianDigits(input) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/[0-9]/g, (d) => persianDigits[d]);
}