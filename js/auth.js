async function login(email, password) {
  const data = await apiFetch("/auth/login/", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  storage.setTokens(data.access, data.refresh);
  localStorage.setItem("jp_user", JSON.stringify(data.user));
  return data.user;
}

async function register(payload) {
  return apiFetch("/auth/register/", {
    method: "POST",
    auth: false,
    body: payload,
  });
}


function logout() {
  storage.clearTokens();
  window.location.href = "login.html";
}

async function getCurrentUser({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = localStorage.getItem("jp_user");
    if (cached) return JSON.parse(cached);
  }
  const user = await apiFetch("/auth/me/");
  localStorage.setItem("jp_user", JSON.stringify(user));
  return user;
}

function requireAuth() {
  if (!storage.getAccess()) {
    window.location.href = "login.html";
    throw new Error("redirecting-to-login");
  }
}

/**
 * @param {"jobseeker"|"company"} role
 */
async function requireRole(role) {
  const user = await getCurrentUser();
  if (user.role !== role) {
    alert("شما اجازه‌ی دسترسی به این صفحه را ندارید.");
    window.location.href = "dashboard.html";
    throw new Error("redirecting-wrong-role");
  }
  return user;
}
