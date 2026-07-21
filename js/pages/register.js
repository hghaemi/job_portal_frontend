if (storage.getAccess()) {
  window.location.href = "dashboard.html";
}


renderPasswordStrengthBox("password-strength-box");
attachPasswordStrengthMeter("password", "password-strength-box");

document.getElementById("register-form").setAttribute("novalidate", "");

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const role = document.getElementById("role").value;
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const passwordConfirm = document.getElementById("password_confirm").value;

  const emailInput = document.getElementById("email");

  const submitBtn = document.getElementById("submit-btn");

  clearAlert("alert-box");


  if (!role) {
    showAlert("alert-box", "لطفاً نوع حساب را انتخاب کنید.", "error");
    return;
  }

  if (!username) {
    showAlert("alert-box", "لطفاً نام کاربری را وارد کنید.", "error");
    return;
  }

  if (username.length < 3) {
    showAlert("alert-box", "نام کاربری باید حداقل ۳ کاراکتر باشد.", "error");
    return;
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/;

  if (!usernameRegex.test(username)) {
    showAlert(
      "alert-box",
      "نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و علامت _ باشد.",
      "error"
    );
    return;
  }

  if (!email) {
    showAlert("alert-box", "لطفاً ایمیل را وارد کنید.", "error");
    return;
  }

  if (emailInput.validity.typeMismatch) {
    showAlert("alert-box", "لطفاً یک ایمیل معتبر وارد کنید.", "error");
    return;
  }

  if (!password) {
    showAlert("alert-box", "لطفاً رمز عبور را وارد کنید.", "error");
    return;
  }

  if (password.length < 8) {
    showAlert("alert-box", "رمز عبور باید حداقل ۸ کاراکتر باشد.", "error");
    return;
  }

  if (!passwordConfirm) {
    showAlert("alert-box", "لطفاً تکرار رمز عبور را وارد کنید.", "error");
    return;
  }

  if (password !== passwordConfirm) {
    showAlert("alert-box", "رمز عبور و تکرار آن یکسان نیستند.", "error");
    return;
  }

  const payload = {
    role,
    username,
    email,
    password,
    password_confirm: passwordConfirm,
  };

  setButtonLoading(submitBtn, true, "در حال ثبت‌نام...");

  try {
    await register(payload);

    showAlert(
      "alert-box",
      "ثبت‌نام با موفقیت انجام شد! در حال انتقال به صفحه ورود...",
      "success"
    );

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);

  } catch (err) {
    showAlert("alert-box", err.message, "error");
    setButtonLoading(submitBtn, false);
  }
});