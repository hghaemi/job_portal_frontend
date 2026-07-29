requireAuth(); 

async function main() {
  const user = await renderShell("dashboard"); 
  const content = document.getElementById("page-content");

  content.innerHTML = `<p class="text-muted">در حال بارگذاری آمار...</p>`;

  try {
    if (user.role === "company") {
      await renderCompanyDashboard(content);
    } else {
      await renderJobSeekerDashboard(content);
    }
  } catch (err) {
    content.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function renderCompanyDashboard(content) {
  const stats = await apiFetch("/dashboard/company/");

  const byStatus = stats.postings_by_status || {};
  const appByStatus = stats.applications_by_status || {};

  content.innerHTML = `
    <h1>داشبورد شرکت</h1>
    <p class="text-muted">خلاصه‌ای از آگهی‌ها و درخواست‌های استخدامی دریافت‌شده</p>

    <div class="grid grid-cols-3" style="margin: 20px 0;">
      <div class="stat-card">
        <div class="stat-value">${toPersianDigits(stats.total_postings)}</div>
        <div class="stat-label">تعداد کل آگهی‌ها</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${toPersianDigits(byStatus.published || 0)}</div>
        <div class="stat-label">آگهی‌های منتشرشده</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${toPersianDigits(stats.total_applications_received)}</div>
        <div class="stat-label">کل درخواست‌های دریافتی</div>
      </div>
    </div>

    <div class="grid grid-cols-2">
      <div class="card">
        <div class="card-title">درخواست‌ها به تفکیک وضعیت</div>
        ${
          Object.keys(appByStatus).length
            ? Object.entries(appByStatus)
                .map(([status, count]) => `<div class="detail-row"><span>${renderBadge(status)}</span><span>${toPersianDigits(count)}</span></div>`)
                .join("")
            : `<p class="text-muted">هنوز درخواستی دریافت نشده است.</p>`
        }
      </div>

      <div class="card">
        <div class="card-title">پرمتقاضی‌ترین آگهی‌ها</div>
        ${
          stats.top_postings_by_applications.length
            ? stats.top_postings_by_applications
                .map(
                  (job) => `
                <div class="detail-row">
                  <a href="job-detail.html?id=${job.id}">${job.title}</a>
                  <span>${toPersianDigits(job.applications_count)} درخواست</span>
                </div>`
                )
                .join("")
            : `<p class="text-muted">هنوز آگهی‌ای ثبت نکرده‌اید.</p>`
        }
      </div>
    </div>

    <div class="page-header" style="margin-top: 24px;">
      <a href="job-form.html" class="btn btn-primary">+ ثبت آگهی شغلی جدید</a>
    </div>
  `;
}

async function renderJobSeekerDashboard(content) {
  const stats = await apiFetch("/dashboard/jobseeker/");
  const byStatus = stats.applications_by_status || {};

  content.innerHTML = `
    <h1>داشبورد کارجو</h1>
    <p class="text-muted">خلاصه‌ای از درخواست‌های استخدامی که ارسال کرده‌اید</p>

    <div class="grid grid-cols-3" style="margin: 20px 0;">
      <div class="stat-card">
        <div class="stat-value">${toPersianDigits(stats.total_applications)}</div>
        <div class="stat-label">تعداد کل درخواست‌ها</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${toPersianDigits(byStatus.pending || 0)}</div>
        <div class="stat-label">در انتظار بررسی</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${toPersianDigits(byStatus.accepted || 0)}</div>
        <div class="stat-label">پذیرفته‌شده</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">آخرین فعالیت‌ها</div>
      ${
        stats.recent_applications.length
          ? stats.recent_applications
              .map(
                (app) => `
              <div class="detail-row">
                <a href="application-detail.html?id=${app.id}">${app["job__title"]}</a>
                <span>${renderBadge(app.status)}</span>
              </div>`
              )
              .join("")
          : `<p class="text-muted">هنوز درخواستی ارسال نکرده‌اید.</p>`
      }
    </div>

    <div class="page-header" style="margin-top: 24px;">
      <a href="jobs.html" class="btn btn-primary">مشاهده آگهی‌های شغلی</a>
    </div>
  `;
}

main();
