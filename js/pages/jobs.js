requireAuth();

let currentUser = null;
let currentPage = 1;
let categories = [];

async function main() {
  currentUser = await renderShell("jobs");
  const content = document.getElementById("page-content");
  const isCompany = currentUser.role === "company";

  try {
    categories = await apiFetch("/jobs/categories/");
  } catch {
    categories = [];
  }
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1>آگهی‌های شغلی</h1>
        <p class="text-muted">جستجو و مشاهده‌ی فرصت‌های شغلی</p>
      </div>
      ${isCompany ? `<a href="job-form.html" class="btn btn-primary">+ ثبت آگهی جدید</a>` : ""}
    </div>

    <div class="filters-bar">
      <input type="text" id="f-keyword" placeholder="جستجو در عنوان و توضیحات..." style="flex: 2; min-width: 220px;" />
      <input type="text" id="f-location" placeholder="محل کار" />
      <select id="f-category">
        <option value="">همه دسته‌بندی‌ها</option>
        ${categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}
      </select>
      <select id="f-job-type">
        <option value="">همه انواع همکاری</option>
        ${Object.entries(JOB_TYPE_LABELS)
          .filter(([val]) => val !== "remote")
          .map(([val, label]) => `<option value="${val}">${label}</option>`)
          .join("")}
      </select>
      <label style="display:flex; align-items:center; gap:6px; font-weight:400; white-space:nowrap;">
        <input type="checkbox" id="f-remote" style="width:auto;" />
        فقط دورکاری
      </label>
      <button class="btn btn-primary" id="search-btn">جستجو</button>
    </div>

    ${isCompany ? `
      <label style="display:flex; align-items:center; gap:8px; margin-bottom: 16px; font-weight: 400;">
        <input type="checkbox" id="f-mine" style="width:auto;" />
        فقط آگهی‌های خودم را نشان بده (شامل پیش‌نویس‌ها)
      </label>
    ` : ""}

    <div id="jobs-list"><p class="text-muted">در حال بارگذاری...</p></div>
    <div class="pagination" id="pagination"></div>
  `;

  document.getElementById("search-btn").addEventListener("click", () => {
    currentPage = 1;
    loadJobs();
  });

  ["f-keyword", "f-location"].forEach((id) => {
  document.getElementById(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      currentPage = 1;
      loadJobs();
    }
  });
});

  if (isCompany) {
    document.getElementById("f-mine").addEventListener("change", () => {
      currentPage = 1;
      loadJobs();
    });
  }

  await loadJobs();
}

async function loadJobs() {
  const listEl = document.getElementById("jobs-list");
  listEl.innerHTML = `<p class="text-muted">در حال بارگذاری...</p>`;

  const params = new URLSearchParams();
  params.set("page", currentPage);

  const keyword = document.getElementById("f-keyword").value.trim();
  const location = document.getElementById("f-location").value.trim();
  const category = document.getElementById("f-category").value;
  const jobType = document.getElementById("f-job-type").value;
  const mineCheckbox = document.getElementById("f-mine");

  if (keyword) params.set("keyword", keyword);
  if (location) params.set("location", location);
  if (category) params.set("category", category);
  if (jobType) params.set("job_type", jobType);
  const remoteOnly = document.getElementById("f-remote").checked;
  if (remoteOnly) params.set("is_remote", "true");
  if (mineCheckbox && mineCheckbox.checked) params.set("mine", "1");

  try {
    const data = await apiFetch(`/jobs/?${params.toString()}`);
    const isMineView = !!(mineCheckbox && mineCheckbox.checked);
    renderJobsList(data, isMineView);
  } catch (err) {
    listEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderJobsList(data, isMineView) {
  const listEl = document.getElementById("jobs-list");

  if (!data.results.length) {
    listEl.innerHTML = `<div class="empty-state">هیچ آگهی‌ای با این فیلترها پیدا نشد.</div>`;
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  listEl.innerHTML = data.results
    .map(
      (job) => `
    <div class="job-card">
      <div style="display:flex; gap:12px;">
        ${
          job.company_logo
            ? `<img
                  src="${job.company_logo}"
                  alt="${job.company_name}"
                  class="company-logo-preview"
                  style="
                    width:48px;
                    height:48px;
                    object-fit:contain;
                    border-radius:8px;
                    border:1px solid #eee;
                    background:#fff;
                    padding:4px;
                  "
                  onerror="this.style.display='none';"
                />`
            : ""
        }
        <div>
          <div class="job-card-title"><a href="job-detail.html?id=${job.id}">${job.title}</a></div>
          <div class="text-muted">${job.company_name || "-"}</div>
          <div class="job-card-meta">
            <span>📍 ${job.location || "نامشخص"}</span>
            <span>${JOB_TYPE_LABELS[job.job_type] || job.job_type}</span>
            <span>${EXPERIENCE_LABELS[job.experience_level] || job.experience_level}</span>
            ${job.is_remote ? "<span>دورکاری</span>" : ""}
          </div>
        </div>
      </div>
      <div style="text-align:left; display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        ${renderBadge(job.status)}
        ${
          isMineView ? `<span class="text-muted">${job.applications_count ?? 0} درخواست</span>` : ""
        }
      </div>
    </div>
  `
    )
    .join("");

  renderPagination(data);
}

function renderPagination(data) {
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(data.count / pageSize));
  const paginationEl = document.getElementById("pagination");

  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  paginationEl.innerHTML = `
    <button class="btn btn-sm" id="prev-page" ${!data.previous ? "disabled" : ""}>قبلی</button>
    <span class="text-muted" style="align-self:center;">صفحه ${currentPage} از ${totalPages}</span>
    <button class="btn btn-sm" id="next-page" ${!data.next ? "disabled" : ""}>بعدی</button>
  `;

  if (data.previous) {
    document.getElementById("prev-page").addEventListener("click", () => {
      currentPage -= 1;
      loadJobs();
    });
  }
  if (data.next) {
    document.getElementById("next-page").addEventListener("click", () => {
      currentPage += 1;
      loadJobs();
    });
  }
}

main();