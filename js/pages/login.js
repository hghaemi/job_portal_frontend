if (storage.getAccess()) {
  window.location.href = "dashboard.html";
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const submitBtn = document.getElementById("submit-btn");

  clearAlert("alert-box");

  if (!email) {
    showAlert("alert-box", "لطفاً ایمیل را وارد کنید.", "error");
    return;
  }

  if (!password) {
    showAlert("alert-box", "لطفاً رمز عبور را وارد کنید.", "error");
    return;
  }

  setButtonLoading(submitBtn, true, "در حال ورود...");

  try {
    await login(email, password);
    window.location.href = "dashboard.html";
  } catch (err) {
    showAlert("alert-box", err.message, "error");
  } finally {
    setButtonLoading(submitBtn, false);
  }
});