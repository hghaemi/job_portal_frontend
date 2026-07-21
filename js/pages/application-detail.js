requireAuth();

const applicationId = getQueryParam("id");

async function main() {
  if (!applicationId) {
    document.body.innerHTML = "<p>شناسه‌ی درخواست مشخص نشده است.</p>";
    return;
  }

  const user = await renderShell("applications");
  const content = document.getElementById("page-content");
  content.innerHTML = `<p class="text-muted">در حال بارگذاری...</p>`;

  try {
    const app = await apiFetch(`/applications/${applicationId}/`);
    renderApplication(content, app, user);
  } catch (err) {
    content.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderApplication(content, app, user) {
  const isMine = user.role === "jobseeker" && app.applicant === user.id;
  const isCompanyView = user.role === "company";

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1>${app.job.title}</h1>
        <p class="text-muted">${app.job.company_name || ""} — ارسال‌شده در ${formatDate(app.applied_at)}</p>
      </div>
      <div>${renderBadge(app.status)}</div>
    </div>

    ${
      isCompanyView
        ? `
      <div class="card">
        <div class="card-title">اطلاعات متقاضی</div>
        <div class="detail-row"><span>نام و نام خانوادگی</span><span>${(app.applicant_profile?.first_name || "") + " " + (app.applicant_profile?.last_name || "")}</span></div>
        <div class="detail-row"><span>ایمیل</span><span>${app.applicant_profile?.email || "-"}</span></div>
        <div class="detail-row"><span>سابقه کار</span><span>${app.applicant_profile?.experience_years ?? "-"} سال</span></div>
        <div class="detail-row"><span>مهارت‌ها</span><span>${(app.applicant_profile?.skills_list || []).join("، ") || "-"}</span></div>
        ${
          app.applicant_profile?.resume_file
            ? `<div class="detail-row"><span>رزومه پروفایل</span><span><a href="${app.applicant_profile.resume_file}" target="_blank">مشاهده</a></span></div>`
            : ""
        }
      </div>
    `
        : ""
    }

    ${
      app.cover_letter
        ? `<div class="card"><div class="card-title">متن انگیزه‌نامه</div><p>${app.cover_letter.replace(/\n/g, "<br/>")}</p></div>`
        : ""
    }

    ${
      app.resume_snapshot
        ? `<div class="card"><div class="card-title">رزومه ارسالی برای این درخواست</div><a href="${app.resume_snapshot}" target="_blank" class="btn btn-sm">دانلود/مشاهده فایل</a></div>`
        : ""
    }

    <div class="card">
      <div class="card-title">تاریخچه وضعیت</div>
      ${
        app.status_history && app.status_history.length
          ? app.status_history
              .map(
                (h) => `<div class="status-history-item">تغییر وضعیت از «${renderBadge(h.old_status)}» به «${renderBadge(h.new_status)}» — ${formatDate(h.changed_at)}</div>`
              )
              .join("")
          : `<p class="text-muted">هنوز تغییری در وضعیت این درخواست ثبت نشده است.</p>`
      }
    </div>

    <div id="action-area"></div>
  `;

  const actionArea = document.getElementById("action-area");

  if (isCompanyView) {
    actionArea.innerHTML = `
      <div class="card">
        <div class="card-title">تغییر وضعیت درخواست</div>
        <div id="alert-box"></div>
        <form id="status-form">
          <div class="form-group">
            <label for="status">وضعیت جدید</label>
            <select id="status">
              ${Object.keys(STATUS_MAP)
                .filter((s) => ["pending", "reviewed", "shortlisted", "rejected", "accepted"].includes(s))
                .map((s) => `<option value="${s}" ${app.status === s ? "selected" : ""}>${STATUS_MAP[s].label}</option>`)
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="company_notes">یادداشت داخلی (فقط برای تیم شما قابل مشاهده است)</label>
            <textarea id="company_notes">${app.company_notes || ""}</textarea>
          </div>
          <button type="submit" class="btn btn-primary" id="submit-btn">ذخیره تغییرات</button>
        </form>
      </div>
    `;

    document.getElementById("status-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("submit-btn");
      clearAlert("alert-box");
      setButtonLoading(btn, true);

      try {
        await apiFetch(`/applications/${applicationId}/`, {
          method: "PATCH",
          body: {
            status: document.getElementById("status").value,
            company_notes: document.getElementById("company_notes").value,
          },
        });
        showAlert("alert-box", "وضعیت درخواست به‌روزرسانی شد.", "success");
      } catch (err) {
        showAlert("alert-box", err.message, "error");
      } finally {
        setButtonLoading(btn, false);
      }
    });
  } else if (isMine) {
    const canWithdraw = !["accepted", "rejected"].includes(app.status);
    actionArea.innerHTML = `
      <div class="card">
        <div id="alert-box"></div>
        ${
          canWithdraw
            ? `<button class="btn btn-danger" id="withdraw-btn">انصراف از این درخواست</button>`
            : `<p class="text-muted">این درخواست نهایی شده و دیگر قابل انصراف نیست.</p>`
        }
      </div>
    `;
    const withdrawBtn = document.getElementById("withdraw-btn");
    if (withdrawBtn) {
      withdrawBtn.addEventListener("click", async () => {
        if (!confirm("آیا از انصراف مطمئن هستید؟")) return;
        try {
          await apiFetch(`/applications/${applicationId}/`, { method: "DELETE" });
          window.location.href = "applications.html";
        } catch (err) {
          showAlert("alert-box", err.message, "error");
        }
      });
    }
  }
}

main();
