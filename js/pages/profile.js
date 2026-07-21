requireAuth();

async function main() {
  const user = await renderShell("profile");
  const content = document.getElementById("page-content");
  content.innerHTML = `<p class="text-muted">در حال بارگذاری پروفایل...</p>`;

  try {
    if (user.role === "company") {
      await renderCompanyProfile(content);
    } else {
      await renderJobSeekerProfile(content);
    }
  } catch (err) {
    content.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function renderJobSeekerProfile(content) {
  const profile = await apiFetch("/profile/jobseeker/");

  content.innerHTML = `
    <h1>پروفایل کارجو</h1>
    <p class="text-muted">این اطلاعات هنگام ارسال درخواست استخدام به شرکت‌ها نمایش داده می‌شود.</p>

      <div class="card" style="max-width: 640px;">
        <div id="alert-box"></div>
        <form id="profile-form" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="first_name">نام <span class="required-mark">*</span></label>
              <input type="text" id="first_name" value="${profile.first_name || ""}" required />
            </div>
            <div class="form-group">
              <label for="last_name">نام خانوادگی <span class="required-mark">*</span></label>
              <input type="text" id="last_name" value="${profile.last_name || ""}" required />
            </div>
          </div>

          <div class="form-group">
            <label for="address">آدرس</label>
            <input type="text" id="address" value="${profile.address || ""}" />
          </div>

          <div class="form-group">
            <label for="bio">درباره من</label>
            <textarea id="bio">${profile.bio || ""}</textarea>
          </div>

          <div class="form-group">
            <label for="education">سوابق تحصیلی</label>
            <textarea id="education">${profile.education || ""}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="skills">مهارت‌ها (با کاما جدا کنید)</label>
              <input type="text" id="skills" value="${profile.skills || ""}" placeholder="Python, Django, DRF" />
            </div>
            <div class="form-group">
              <label for="experience_years">سابقه کار (سال)</label>
              <input type="number" id="experience_years" min="0" value="${profile.experience_years || 0}" />
            </div>
          </div>

          <div class="form-group">
            <label for="resume_file">فایل رزومه (PDF/Word)</label>
            ${
              profile.resume_file
                ? `<div class="helper-text">فایل فعلی: <a href="${profile.resume_file}" target="_blank">مشاهده رزومه فعلی</a></div>`
                : `<div class="helper-text">هنوز رزومه‌ای آپلود نکرده‌اید.</div>`
            }
            <input type="file" id="resume_file" accept=".pdf,.doc,.docx" />
          </div>

          <button type="submit" class="btn btn-primary" id="submit-btn">ذخیره تغییرات</button>
        </form>
      </div>
    `;

  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("submit-btn");
    clearAlert("alert-box");

    const firstName = document.getElementById("first_name").value.trim();
    const lastName = document.getElementById("last_name").value.trim();

    if (!firstName) {
      showAlert("alert-box", "وارد کردن نام الزامی است.", "error");
      return;
    }

    if (!lastName) {
      showAlert("alert-box", "وارد کردن نام خانوادگی الزامی است.", "error");
      return;
    }

    setButtonLoading(submitBtn, true);


    
    const formData = new FormData();
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("address", document.getElementById("address").value);
    formData.append("bio", document.getElementById("bio").value);
    formData.append("education", document.getElementById("education").value);
    formData.append("skills", document.getElementById("skills").value);
    formData.append("experience_years", document.getElementById("experience_years").value);

    const resumeFileInput = document.getElementById("resume_file");
    if (resumeFileInput.files.length > 0) {
      formData.append("resume_file", resumeFileInput.files[0]);
    }

    try {
      await apiFetch("/profile/jobseeker/", {
        method: "PATCH",
        body: formData,
        isFormData: true,
      });

      showAlert("alert-box", "پروفایل با موفقیت به‌روزرسانی شد.", "success");

      setTimeout(() => {
        window.location.reload();
      }, 800);

    } catch (err) {
          showAlert("alert-box", err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

async function renderCompanyProfile(content) {
  const profile = await apiFetch("/profile/company/");

  content.innerHTML = `
    <h1>پروفایل شرکت</h1>
    <p class="text-muted">
      این اطلاعات در صفحه‌ی آگهی‌های شغلی شما به کارجوها نمایش داده می‌شود.
    </p>

    <div class="card" style="max-width:760px;">
      <div id="alert-box"></div>

      <form id="profile-form" novalidate>

        <div style="display:flex;justify-content:center;margin-bottom:24px;">

          ${
            profile.logo
              ? `
                <div
                  style="
                    width:160px;
                    height:160px;
                    border:1px solid #ddd;
                    border-radius:12px;
                    overflow:hidden;
                    background:#fff;
                    display:flex;
                    justify-content:center;
                    align-items:center;
                  "
                >
                  <img
                    src="${profile.logo}"
                    alt="لوگوی شرکت"
                    onerror="this.src='assets/images/company-placeholder.png'"
                    style="
                      max-width:100%;
                      max-height:100%;
                      width:auto;
                      height:auto;
                      object-fit:contain;
                      display:block;
                    "
                  >
                </div>
              `
              : `
                <div
                  style="
                    width:160px;
                    height:160px;
                    border:1px solid #ddd;
                    border-radius:12px;
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    background:#fafafa;
                  "
                >
                  بدون لوگو
                </div>
              `
          }

        </div>

        <div class="form-group">
          <label for="company_name">
            نام شرکت <span class="required-mark">*</span>
          </label>
          <input
            type="text"
            id="company_name"
            value="${profile.company_name || ""}"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">
            درباره شرکت <span class="required-mark">*</span>
          </label>
          <textarea
            id="description"
            required
          >${profile.description || ""}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="website">وب‌سایت</label>
            <input
              type="url"
              id="website"
              value="${profile.website || ""}"
              placeholder="https://example.com"
            />
          </div>

          <div class="form-group">
            <label for="industry">
              صنعت <span class="required-mark">*</span>
            </label>
            <input
              type="text"
              id="industry"
              value="${profile.industry || ""}"
              placeholder="مثلاً نرم‌افزار"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="address">آدرس</label>
            <input
              type="text"
              id="address"
              value="${profile.address || ""}"
            />
          </div>

          <div class="form-group">
            <label for="founded_year">سال تأسیس</label>
            <input
              type="number"
              id="founded_year"
              value="${profile.founded_year || ""}"
              placeholder="مثلا 1405"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="logo">تغییر لوگوی شرکت</label>
          <input
            type="file"
            id="logo"
            accept="image/*"
          />
          <div class="helper-text">
            پس از انتخاب تصویر، روی «ذخیره تغییرات» کلیک کنید.
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          id="submit-btn"
        >
          ذخیره تغییرات
        </button>

      </form>
    </div>
  `;

  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("submit-btn");
    clearAlert("alert-box");

    const companyName = document.getElementById("company_name").value.trim();
    const description = document.getElementById("description").value.trim();
    const industry = document.getElementById("industry").value.trim();

    if (!companyName) {
      showAlert("alert-box", "وارد کردن نام شرکت الزامی است.", "error");
      return;
    }

    if (!description) {
      showAlert("alert-box", "وارد کردن «درباره شرکت» الزامی است.", "error");
      return;
    }

    if (!industry) {
      showAlert("alert-box", "وارد کردن صنعت الزامی است.", "error");
      return;
    }

    setButtonLoading(submitBtn, true);

    const formData = new FormData();
    formData.append("company_name", companyName);
    formData.append("description", description);
    formData.append("website", document.getElementById("website").value);
    formData.append("industry", industry);
    formData.append("address", document.getElementById("address").value);
    formData.append("founded_year", document.getElementById("founded_year").value);

    const logoInput = document.getElementById("logo");
    if (logoInput.files.length > 0) {
      formData.append("logo", logoInput.files[0]);
    }

    try {
      await apiFetch("/profile/company/", { method: "PATCH", body: formData, isFormData: true });
      showAlert("alert-box", "پروفایل با موفقیت به‌روزرسانی شد.", "success");
      setTimeout(() => {location.reload();}, 700);          
    } catch (err) {
      showAlert("alert-box", err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

main();