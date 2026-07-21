const JALALI_TABLE_START_YEAR = 1290;
const JALALI_NOWRUZ_SERIALS = [
  -21470, -21105, -20740, -20374, -20009, -19644, -19279, -18913, -18548, -18183,
  -17818, -17452, -17087, -16722, -16357, -15991, -15626, -15261, -14896, -14531,
  -14165, -13800, -13435, -13070, -12704, -12339, -11974, -11609, -11243, -10878,
  -10513, -10148, -9782, -9417, -9052, -8687, -8321, -7956, -7591, -7226,
  -6860, -6495, -6130, -5765, -5399, -5034, -4669, -4304, -3938, -3573,
  -3208, -2843, -2478, -2112, -1747, -1382, -1017, -651, -286, 79,
  444, 810, 1175, 1540, 1905, 2271, 2636, 3001, 3366, 3732,
  4097, 4462, 4827, 5193, 5558, 5923, 6288, 6654, 7019, 7384,
  7749, 8115, 8480, 8845, 9210, 9575, 9941, 10306, 10671, 11036,
  11402, 11767, 12132, 12497, 12863, 13228, 13593, 13958, 14324, 14689,
  15054, 15419, 15785, 16150, 16515, 16880, 17246, 17611, 17976, 18341,
  18707, 19072, 19437, 19802, 20168, 20533, 20898, 21263, 21628, 21994,
  22359, 22724, 23089, 23455, 23820, 24185, 24550, 24916, 25281, 25646,
  26011, 26377, 26742, 27107, 27472, 27838, 28203, 28568, 28933, 29299,
  29664, 30029, 30394, 30760, 31125, 31490, 31855, 32221, 32586, 32951,
  33316, 33681, 34047, 34412, 34777, 35142, 35508, 35873, 36238, 36603,
  36969, 37334, 37699, 38064, 38430, 38795, 39160, 39525, 39891, 40256,
  40621, 40986,
];

function gregorianToSerial(gy, gm, gd) {
  return Math.round(Date.UTC(gy, gm - 1, gd) / 86400000);
}

function serialToGregorian(serial) {
  const d = new Date(serial * 86400000);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
}

function dayOfYearToMonthDay(dayOfYear) {
  if (dayOfYear < 186) {
    return [1 + Math.floor(dayOfYear / 31), 1 + (dayOfYear % 31)];
  }
  const rem = dayOfYear - 186;
  return [7 + Math.floor(rem / 30), 1 + (rem % 30)];
}

function monthDayToDayOfYear(jm, jd) {
  if (jm <= 6) return (jm - 1) * 31 + (jd - 1);
  return 186 + (jm - 7) * 30 + (jd - 1);
}

function gregorianToJalali(gy, gm, gd) {
  const serial = gregorianToSerial(gy, gm, gd);
  let idx = -1;
  for (let i = 0; i < JALALI_NOWRUZ_SERIALS.length; i++) {
    if (JALALI_NOWRUZ_SERIALS[i] <= serial) idx = i;
    else break;
  }
  const jy = JALALI_TABLE_START_YEAR + idx;
  const dayOfYear = serial - JALALI_NOWRUZ_SERIALS[idx];
  const [jm, jd] = dayOfYearToMonthDay(dayOfYear);
  return [jy, jm, jd];
}

function jalaliToGregorian(jy, jm, jd) {
  const idx = jy - JALALI_TABLE_START_YEAR;
  const serial = JALALI_NOWRUZ_SERIALS[idx] + monthDayToDayOfYear(jm, jd);
  return serialToGregorian(serial);
}

function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const idx = jy - JALALI_TABLE_START_YEAR;
  const yearLength = JALALI_NOWRUZ_SERIALS[idx + 1] - JALALI_NOWRUZ_SERIALS[idx];
  return yearLength - 336;
}

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const JALALI_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function gregorianISOToJalaliDisplay(isoDate) {
  if (!isoDate) return "";
  const [gy, gm, gd] = isoDate.split("-").map(Number);
  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

function attachJalaliDatePicker(inputId, hiddenInputId, initialISODate = "") {
  const input = document.getElementById(inputId);
  const hidden = document.getElementById(hiddenInputId);
  if (!input || !hidden) return;

  const today = new Date();
  let [curJy, curJm] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
  let selectedISO = "";

  if (initialISODate) {
    hidden.value = initialISODate;
    input.value = gregorianISOToJalaliDisplay(initialISODate);
    const [gy, gm, gd] = initialISODate.split("-").map(Number);
    [curJy, curJm] = gregorianToJalali(gy, gm, gd);
    selectedISO = initialISODate;
  }

  const popover = document.createElement("div");
  popover.className = "jalali-popover";
  popover.style.display = "none";
  document.body.appendChild(popover);

  function closePopover() {
    popover.style.display = "none";
  }

  function renderCalendar() {
    const monthLength = jalaliMonthLength(curJy, curJm);
    const [firstGy, firstGm, firstGd] = jalaliToGregorian(curJy, curJm, 1);
    const firstWeekdayJs = new Date(firstGy, firstGm - 1, firstGd).getDay();
    const startOffset = (firstWeekdayJs + 1) % 7;

    let daysHtml = "";
    for (let i = 0; i < startOffset; i++) {
      daysHtml += `<span class="jalali-day jalali-day-empty"></span>`;
    }
    for (let d = 1; d <= monthLength; d++) {
      const [gy, gm, gd] = jalaliToGregorian(curJy, curJm, d);
      const iso = `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
      const isSelected = iso === selectedISO;
      const display = `${curJy}/${String(curJm).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
      daysHtml += `<span class="jalali-day ${isSelected ? "jalali-day-selected" : ""}" data-iso="${iso}" data-display="${display}">${d}</span>`;
    }

    popover.innerHTML = `
      <div class="jalali-header">
        <button type="button" class="jalali-nav" data-dir="prev">‹</button>
        <span>${JALALI_MONTHS[curJm - 1]} ${curJy}</span>
        <button type="button" class="jalali-nav" data-dir="next">›</button>
      </div>
      <div class="jalali-weekdays">${JALALI_WEEKDAYS.map((w) => `<span>${w}</span>`).join("")}</div>
      <div class="jalali-days">${daysHtml}</div>
    `;

    popover.querySelector('[data-dir="prev"]').addEventListener("click", (e) => {
      e.stopPropagation();
      curJm--;
      if (curJm < 1) { curJm = 12; curJy--; }
      renderCalendar();
    });
    popover.querySelector('[data-dir="next"]').addEventListener("click", (e) => {
      e.stopPropagation();
      curJm++;
      if (curJm > 12) { curJm = 1; curJy++; }
      renderCalendar();
    });
    popover.querySelectorAll(".jalali-day[data-iso]").forEach((el) => {
      el.addEventListener("click", () => {
        selectedISO = el.dataset.iso;
        hidden.value = selectedISO;
        input.value = el.dataset.display;
        closePopover();
      });
    });
  }

  input.addEventListener("click", (e) => {
    e.stopPropagation();
    renderCalendar();
    const rect = input.getBoundingClientRect();
    popover.style.position = "absolute";
    popover.style.top = `${window.scrollY + rect.bottom + 4}px`;
    popover.style.left = `${window.scrollX + rect.left}px`;
    popover.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    if (!popover.contains(e.target) && e.target !== input) closePopover();
  });
}