requireAuth();

const jobId = getQueryParam("id");

async function main() {
  if (!jobId) {
    document.body.innerHTML = "<p>شناسه‌ی آگهی مشخص نشده است.</p>";
    return;
  }

  const user = await renderShell("jobs");
  const content = document.getElementById("page-content");
  content.innerHTML = `<p class="text-muted">در حال بارگذاری...</p>`;

  try {
    const job = await apiFetch(`/jobs/${jobId}/`);
    const isOwnerCompany = user.role === "company" && job.company === user.id;

    let existingApplication = null;
    if (user.role === "jobseeker") {
      const myApplications = await apiFetch(`/applications/?job=${job.id}`);
      existingApplication = myApplications.results[0] || null;
    }

    renderJob(content, job, user, isOwnerCompany, existingApplication);
  } catch (err) {
    content.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderJob(content, job, user, isOwnerCompany, existingApplication) {
  content.innerHTML = `
    <div class="page-header">
      <div class="company-header">
        ${
          job.company_detail && job.company_detail.logo
            ? `<img
                  src="${job.company_detail.logo}"
                  alt="${job.company_detail.company_name}"
                  class="company-logo-preview"
                  onerror="this.style.display='none';"
              />`
            : ""
        }
        <div>
          <h1>${job.title}</h1>
          <p class="text-muted">${job.company_detail ? job.company_detail.company_name : ""} ${job.location ? "— " + job.location : ""}</p>
        </div>
      </div>
      <div>${renderBadge(job.status)}</div>
    </div>

    <div class="card">
      <div class="detail-row"><span>نوع همکاری</span><span>${JOB_TYPE_LABELS[job.job_type] || job.job_type}</span></div>
      <div class="detail-row"><span>سطح تجربه</span><span>${EXPERIENCE_LABELS[job.experience_level] || job.experience_level}</span></div>
      <div class="detail-row"><span>دورکاری</span><span>${job.is_remote ? "بله" : "خیر"}</span></div>
      ${
        job.salary_is_visible && (job.salary_min || job.salary_max)
          ? `<div class="detail-row"><span>بازه حقوق</span><span>${job.salary_min ?? "?"} تا ${job.salary_max ?? "?"}</span></div>`
          : ""
      }
      <div class="detail-row"><span>مهلت ارسال درخواست</span><span>${formatDate(job.application_deadline)}</span></div>
      ${
        isOwnerCompany
          ? `<div class="detail-row"><span>تعداد درخواست‌های دریافتی</span><span>${job.applications_count}</span></div>`
          : ""
      }
    </div>

    <div class="card">
      <div class="card-title">توضیحات شغل</div>
      <p>${String(job.description || "").replace(/\n/g, "<br/>")}</p>
    </div>

    ${
      job.requirements
        ? `<div class="card"><div class="card-title">شرایط موردنیاز</div><p>${String(job.requirements).replace(/\n/g, "<br/>")}</p></div>`
        : ""
    }

    ${
      job.responsibilities
        ? `<div class="card"><div class="card-title">مسئولیت‌ها</div><p>${String(job.responsibilities).replace(/\n/g, "<br/>")}</p></div>`
        : ""
    }

    <div id="action-area"></div>
  `;

  const actionArea = document.getElementById("action-area");

  if (isOwnerCompany) {
    actionArea.innerHTML = `
      <div class="card">
        <div class="card-title">مدیریت این آگهی</div>
        <div style="display:flex; gap:12px; flex-wrap: wrap;">
          <a href="job-form.html?id=${job.id}" class="btn">ویرایش آگهی</a>
          <a href="applications.html?job=${job.id}" class="btn">مشاهده درخواست‌های این آگهی</a>
          <button class="btn btn-danger" id="delete-btn">حذف آگهی</button>
        </div>
        <div id="alert-box" style="margin-top: 12px;"></div>
      </div>
    `;
    document.getElementById("delete-btn").addEventListener("click", () => deleteJob(job.id));
  } else if (user.role === "jobseeker" && job.status === "published" && existingApplication) {

    actionArea.innerHTML = `
      <div class="card">
        <div class="card-title">وضعیت درخواست شما</div>
        <p>شما قبلاً برای این آگهی درخواست داده‌اید و دیگر نمی‌توانید دوباره درخواست بفرستید.</p>
        <div style="display:flex; align-items:center; gap:10px;">
          ${renderBadge(existingApplication.status)}
          <a href="application-detail.html?id=${existingApplication.id}" class="btn btn-sm">مشاهده جزئیات درخواست</a>
        </div>
      </div>
    `;
  } else if (user.role === "jobseeker" && job.status === "published") {

    actionArea.innerHTML = `
      <div class="card">
        <div class="card-title">ارسال درخواست برای این شغل</div>
        <div id="alert-box"></div>
        <form id="apply-form">
          <div class="form-group">
            <label for="cover_letter">متن انگیزه‌نامه (اختیاری)</label>
            <textarea id="cover_letter" placeholder="چرا برای این موقعیت مناسب هستید؟"></textarea>
          </div>
          <div class="form-group">
            <label for="resume_snapshot">فایل رزومه مخصوص این درخواست (اختیاری)</label>
            <div class="helper-text">
              اگر خالی بگذارید، رزومه‌ی ارسالی برای این درخواست خالی می‌ماند؛ اما شرکت همچنان می‌تواند
              رزومه‌ی ثبت‌شده در «پروفایل» شما را ببیند. برای شانس بهتر، پیشنهاد می‌شود یک رزومه
              (حتی همان فایل پروفایل) اینجا هم پیوست کنید.
            </div>
            <input type="file" id="resume_snapshot" accept=".pdf,.doc,.docx" />
          </div>
          <button type="submit" class="btn btn-primary" id="apply-btn">ارسال درخواست</button>
        </form>
      </div>
    `;

    document.getElementById("apply-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("apply-btn");
      clearAlert("alert-box");
      setButtonLoading(btn, true);

      const formData = new FormData();
      formData.append("job", job.id);
      formData.append("cover_letter", document.getElementById("cover_letter").value);
      const fileInput = document.getElementById("resume_snapshot");
      if (fileInput.files.length > 0) {
        formData.append("resume_snapshot", fileInput.files[0]);
      }

      try {
        await apiFetch("/applications/", { method: "POST", body: formData, isFormData: true });
        showAlert("alert-box", "درخواست شما با موفقیت ارسال شد.", "success");
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showAlert("alert-box", err.message, "error");
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }
}

async function deleteJob(id) {
  if (!confirm("آیا از حذف این آگهی مطمئن هستید؟ این عمل قابل بازگشت نیست.")) return;

  try {
    await apiFetch(`/jobs/${id}/`, { method: "DELETE" });
    window.location.href = "jobs.html";
  } catch (err) {
    showAlert("alert-box", err.message, "error");
  }
}

main();