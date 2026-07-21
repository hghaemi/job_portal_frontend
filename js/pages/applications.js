requireAuth();

async function main() {
  const user = await renderShell("applications");
  const content = document.getElementById("page-content");
  const jobFilter = getQueryParam("job");

  content.innerHTML = `
    <h1>${user.role === "company" ? "درخواست‌های دریافتی" : "درخواست‌های ارسالی من"}</h1>
    <p class="text-muted">
      ${user.role === "company" ? "لیست کارجویانی که برای آگهی‌های شما درخواست داده‌اند." : "وضعیت درخواست‌های استخدامی که ارسال کرده‌اید."}
      ${jobFilter ? " (فیلترشده برای یک آگهی خاص)" : ""}
    </p>
    <div id="list-area"><p class="text-muted">در حال بارگذاری...</p></div>
  `;

  try {
    const path = jobFilter ? `/applications/?job=${jobFilter}` : "/applications/";
    const data = await apiFetch(path);
    renderList(data.results, user);
  } catch (err) {
    document.getElementById("list-area").innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderList(applications, user) {
  const listArea = document.getElementById("list-area");

  if (!applications.length) {
    listArea.innerHTML = `<div class="empty-state">هنوز درخواستی ثبت نشده است.</div>`;
    return;
  }

  listArea.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>عنوان شغل</th>
          ${user.role === "jobseeker" ? "<th>شرکت</th>" : ""}
          <th>وضعیت</th>
          <th>تاریخ ارسال</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${applications
          .map(
            (app) => `
          <tr>
            <td>${app.job_title}</td>
            ${user.role === "jobseeker" ? `<td>${app.company_name || "-"}</td>` : ""}
            <td>${renderBadge(app.status)}</td>
            <td>${formatDate(app.applied_at)}</td>
            <td><a href="application-detail.html?id=${app.id}" class="btn btn-sm">مشاهده جزئیات</a></td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

main();
