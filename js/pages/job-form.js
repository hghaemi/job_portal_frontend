requireAuth();

const editingJobId = getQueryParam("id");

async function main() {
  await requireRole("company");
  await renderShell("jobs");
  const content = document.getElementById("page-content");

  const categories = await apiFetch("/jobs/categories/");
  let existingJob = null;

  if (editingJobId) {
    existingJob = await apiFetch(`/jobs/${editingJobId}/`);
  }

  content.innerHTML = `
    <h1>${editingJobId ? "ویرایش آگهی شغلی" : "ثبت آگهی شغلی جدید"}</h1>

    <div class="card" style="max-width: 720px;">
      <div id="alert-box"></div>
      <form id="job-form" novalidate>
        <div class="form-group">
          <label for="title">عنوان شغل <span class="required-mark">*</span></label>
          <input type="text" id="title" required value="${existingJob ? existingJob.title : ""}" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category">دسته‌بندی <span class="required-mark">*</span></label>
            <select id="category" required>
              <option value="">انتخاب کنید...</option>
              ${categories
                .map(
                  (c) =>
                    `<option value="${c.id}" ${existingJob && existingJob.category === c.id ? "selected" : ""}>${c.name}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="location">
              محل کار <span class="required-mark" id="location-required-mark">*</span>
            </label>
            <input type="text" id="location" value="${existingJob ? existingJob.location || "" : ""}" />
            <div class="helper-text" id="location-helper">اگر «دورکاری» را تیک بزنید، پر کردن این فیلد لازم نیست.</div>
          </div>
        </div>

        <div class="form-group">
          <label style="display:flex; align-items:center; gap:8px; font-weight:400;">
            <input type="checkbox" id="is_remote" style="width:auto;" ${existingJob && existingJob.is_remote ? "checked" : ""} />
            این موقعیت دورکاری است
          </label>
        </div>

        <div class="form-group">
          <label for="description">توضیحات شغل <span class="required-mark">*</span></label>
          <textarea id="description" required>${existingJob ? existingJob.description : ""}</textarea>
        </div>

        <div class="form-group">
          <label for="requirements">شرایط موردنیاز (هر خط یک مورد) <span class="required-mark">*</span></label>
          <textarea id="requirements" required>${existingJob ? existingJob.requirements : ""}</textarea>
        </div>

        <div class="form-group">
          <label for="responsibilities">مسئولیت‌ها <span class="required-mark">*</span></label>
          <textarea id="responsibilities" required>${existingJob ? existingJob.responsibilities : ""}</textarea>        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="job_type">نوع همکاری <span class="required-mark">*</span></label>
            <select id="job_type" required>
              ${Object.entries(JOB_TYPE_LABELS)
                .filter(([val]) => val !== "remote")
                .map(
                  ([val, label]) =>
                    `<option value="${val}" ${existingJob && existingJob.job_type === val ? "selected" : ""}>${label}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="experience_level">سطح تجربه <span class="required-mark">*</span></label>
            <select id="experience_level" required>
              ${Object.entries(EXPERIENCE_LABELS)
                .map(
                  ([val, label]) =>
                    `<option value="${val}" ${existingJob && existingJob.experience_level === val ? "selected" : ""}>${label}</option>`
                )
                .join("")}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="salary_min">حداقل حقوق (اختیاری)</label>
            <input type="number" id="salary_min" value="${existingJob && existingJob.salary_min ? existingJob.salary_min : ""}" />
          </div>
          <div class="form-group">
            <label for="salary_max">حداکثر حقوق (اختیاری)</label>
            <input type="number" id="salary_max" value="${existingJob && existingJob.salary_max ? existingJob.salary_max : ""}" />
          </div>
        </div>

        <div class="form-group">
          <label for="application_deadline_display">مهلت ارسال درخواست (تقویم شمسی)</label>
          <input type="text" id="application_deadline_display" readonly placeholder="برای انتخاب تاریخ کلیک کنید" autocomplete="off" />
          <input type="hidden" id="application_deadline" />
          <div class="helper-text">این فیلد اختیاری است؛ اگر خالی بماند، آگهی مهلت مشخصی نخواهد داشت.</div>
        </div>

        <div class="form-group">
          <label for="status">وضعیت آگهی</label>
          <select id="status">
            <option value="draft" ${existingJob && existingJob.status === "draft" ? "selected" : ""}>پیش‌نویس (فقط خودم می‌بینم)</option>
            <option value="published" ${!existingJob || existingJob.status === "published" ? "selected" : ""}>منتشرشده (همه می‌بینند)</option>
            <option value="closed" ${existingJob && existingJob.status === "closed" ? "selected" : ""}>بسته‌شده</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary" id="submit-btn">${editingJobId ? "ذخیره تغییرات" : "ثبت آگهی"}</button>
      </form>
    </div>
  `;


  
  try {
    attachJalaliDatePicker(
      "application_deadline_display",
      "application_deadline",
      existingJob ? existingJob.application_deadline || "" : ""
    );
  } catch (err) {
    console.error("Jalali date picker failed to load:", err);
    showAlert("alert-box", "تقویم شمسی لود نشد (js/jalali.js را چک کنید)، ولی می‌توانید بدون تاریخ ثبت کنید.", "error");
  }

  const isRemoteCheckbox = document.getElementById("is_remote");
  const locationMark = document.getElementById("location-required-mark");
  function syncLocationRequirement() {
    locationMark.style.display = isRemoteCheckbox.checked ? "none" : "inline";
  }
  isRemoteCheckbox.addEventListener("change", syncLocationRequirement);
  syncLocationRequirement();

  document.getElementById("job-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submit-btn");
    clearAlert("alert-box");

    try {
      const title = document.getElementById("title").value.trim();
      const location = document.getElementById("location").value.trim();
      const description = document.getElementById("description").value.trim();
      const requirements = document.getElementById("requirements").value.trim();
      const responsibilities = document.getElementById("responsibilities").value.trim();
      const category = document.getElementById("category").value;
      const isRemote = document.getElementById("is_remote").checked;

      const rules = [
        { value: title, message: "وارد کردن «عنوان شغل» الزامی است." },
        { value: category, message: "انتخاب «دسته‌بندی» الزامی است." },
        { value: description, message: "وارد کردن «توضیحات شغل» الزامی است." },
        { value: requirements, message: "وارد کردن «شرایط موردنیاز» الزامی است." },
        { value: responsibilities, message: "وارد کردن «مسئولیت‌ها» الزامی است." },
      ];

      if (!isRemote) {
        rules.push({ value: location, message: "برای آگهی‌های غیردورکاری، وارد کردن «محل کار» الزامی است." });
      }
      const validationError = validateRequired(rules);
      if (validationError) {
        showAlert("alert-box", validationError, "error");
        return;
      }

      const salaryMin = Number(document.getElementById("salary_min").value) || null;
      const salaryMax = Number(document.getElementById("salary_max").value) || null;
      if (salaryMin && salaryMax && salaryMin > salaryMax) {
        showAlert("alert-box", "حداقل حقوق نمی‌تواند بیشتر از حداکثر حقوق باشد.", "error");
        return;
      }

      setButtonLoading(btn, true);

      const payload = {
        title,
        category: category || null,

        location,
        description,
        requirements,
        responsibilities: document.getElementById("responsibilities").value,
        job_type: document.getElementById("job_type").value,
        experience_level: document.getElementById("experience_level").value,
        salary_min: salaryMin,
        salary_max: salaryMax,
        application_deadline: document.getElementById("application_deadline").value || null,
        status: document.getElementById("status").value,
        is_remote: isRemote,
      };

      if (editingJobId) {
        await apiFetch(`/jobs/${editingJobId}/`, { method: "PATCH", body: payload });
        showAlert("alert-box", "تغییرات با موفقیت ذخیره شد.", "success");
      } else {
        await apiFetch("/jobs/", { method: "POST", body: payload });
        showAlert("alert-box", "آگهی با موفقیت ثبت شد.", "success");
      }
      setTimeout(() => (window.location.href = "jobs.html"), 900);
    } catch (err) {
      console.error(err);
      showAlert("alert-box", err.message, "error");
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

main();