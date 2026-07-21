requireAuth();

async function main() {
  await renderShell("change-password");
  const content = document.getElementById("page-content");

  content.innerHTML = `
    <h1>تغییر رمز عبور</h1>
    <p class="text-muted">برای امنیت بیشتر، رمز عبور فعلی خود را وارد کنید و سپس رمز جدید را انتخاب کنید.</p>

    <div class="card" style="max-width: 480px;">
      <div id="alert-box"></div>
      <form id="password-form" novalidate>
        <div class="form-group">
          <label for="old_password">رمز عبور فعلی <span class="required-mark">*</span></label>
          <input type="password" id="old_password" required />
        </div>

        <div class="form-group">
          <label for="new_password">رمز عبور جدید <span class="required-mark">*</span></label>
          <input type="password" id="new_password" required />
          <div id="password-strength-box"></div>
        </div>

        <button type="submit" class="btn btn-primary" id="submit-btn">
          ثبت تغییرات
        </button>
      </form>
    </div>
  `;

  renderPasswordStrengthBox("password-strength-box");
  attachPasswordStrengthMeter("new_password", "password-strength-box");

  document.getElementById("password-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submit-btn");
    clearAlert("alert-box");

    const oldPassword = document.getElementById("old_password").value;
    const newPassword = document.getElementById("new_password").value;

    // اعتبارسنجی
    if (!oldPassword) {
      showAlert("alert-box", "لطفاً رمز عبور فعلی را وارد کنید.", "error");
      return;
    }

    if (!newPassword) {
      showAlert("alert-box", "لطفاً رمز عبور جدید را وارد کنید.", "error");
      return;
    }

    setButtonLoading(submitBtn, true);

    try {
      await apiFetch("/auth/change-password/", {
        method: "POST",
        body: {
          old_password: oldPassword,
          new_password: newPassword,
        },
      });

      showAlert("alert-box", "رمز عبور با موفقیت تغییر کرد.", "success");
      document.getElementById("password-form").reset();
    } catch (err) {
      showAlert("alert-box", err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

main();