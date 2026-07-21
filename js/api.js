const TOKEN_KEYS = {
  ACCESS: "jp_access_token",
  REFRESH: "jp_refresh_token",
};

const storage = {
  getAccess: () => localStorage.getItem(TOKEN_KEYS.ACCESS),
  getRefresh: () => localStorage.getItem(TOKEN_KEYS.REFRESH),
  setTokens: (access, refresh) => {
    localStorage.setItem(TOKEN_KEYS.ACCESS, access);
    if (refresh) localStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    localStorage.removeItem("jp_user");
  },
};

/**
 * @returns {Promise<boolean>}
 */

async function tryRefreshToken() {
  const refresh = storage.getRefresh();
  if (!refresh) return false;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    storage.setTokens(data.access, null);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * @param {string} path  
 * @param {object} options 
 */
async function apiFetch(path, { method = "GET", body = null, auth = true, isFormData = false } = {}) {
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = storage.getAccess();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const doRequest = () =>
    fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

  let res;
  try {
    res = await doRequest();
  } catch (networkErr) {
    throw new Error(
      "امکان اتصال به سرور وجود ندارد. لطفاً مطمئن شوید بک‌اند جنگو در حال اجراست و آدرس آن در js/config.js درست تنظیم شده است."
    );
  }

  if (res.status === 401 && auth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${storage.getAccess()}`;
      try {
        res = await doRequest();
      } catch (networkErr) {
        throw new Error("امکان اتصال به سرور وجود ندارد. لطفاً دوباره تلاش کنید.");
      }
    } else {
      storage.clearTokens();
      window.location.href = "login.html";
      throw new Error("نشست شما منقضی شده است. لطفاً دوباره وارد شوید.");
    }
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
  }

  if (!res.ok) {
    const message = extractErrorMessageFa(data);
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

