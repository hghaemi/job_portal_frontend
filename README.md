# Job Portal – Front-End

Web client for the Job Portal. It is written with plain **HTML, CSS and JavaScript** (no framework, no build step) and talks to the Django REST API in the `backend` project. The interface is fully **Persian (RTL)** and uses a **Jalali calendar**.

## Features

- Registration and login with a password strength meter
- Role-based interface: **job seeker** and **company**
- Dashboard with statistics for each role
- Job list with keyword, location, category, job type and remote filters, plus pagination
- Job details page with an application form (cover letter and resume file)
- Job form for companies (create/edit) with a Jalali date picker for the application deadline
- Lists and detail pages for applications, status change and internal notes (company), withdrawal (job seeker)
- Profile pages for job seekers (resume upload) and companies (logo upload) and a change-password page
- Automatic token refresh, Persian error messages and Persian digits everywhere

## Tech

| Area | Used |
|---|---|
| Markup / style / logic | HTML5, CSS3 (variables, Flexbox, Grid), vanilla JavaScript (async/await, Fetch API) |
| Session storage | `localStorage` (access token, refresh token, current user) |
| Font | [Vazirmatn](https://github.com/rastikerdar/vazirmatn), loaded from Google Fonts |
| Calendar | Custom Jalali converter and date picker (`js/jalali.js`) |

## Project structure

```
frontend/
├── index.html              # redirects to dashboard or login
├── login.html
├── register.html
├── dashboard.html
├── jobs.html
├── job-detail.html
├── job-form.html
├── applications.html
├── application-detail.html
├── profile.html
├── change-password.html
├── css/
│   └── style.css
└── js/
    ├── config.js           # API base URL
    ├── api.js              # token storage, apiFetch, automatic refresh
    ├── auth.js             # login, register, logout, requireAuth, requireRole
    ├── ui.js               # layout shell, alerts, badges, helpers, Persian digits
    ├── errors-fa.js        # translation of API errors to Persian
    ├── jalali.js           # Jalali <-> Gregorian conversion and date picker
    └── pages/              # one script per page
        ├── login.js
        ├── register.js
        ├── dashboard.js
        ├── jobs.js
        ├── job-detail.js
        ├── job-form.js
        ├── applications.js
        ├── application-detail.js
        ├── profile.js
        └── change-password.js
```

## Getting started

### 1. Start the back-end

Follow the back-end README first. The API must be running, by default at `http://127.0.0.1:8000`, and at least one job category must exist (create it in the Django admin), otherwise companies cannot complete the job form.

### 2. Check the API address

`js/config.js` holds the address of the API:

```js
const CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000/api",
};
```

### 3. Serve the files

Any static file server works. For example, from the front-end folder:

```bash
python -m http.server 3000
```

Open `http://localhost:3000`. The origin you use must be allowed by the back-end (`CORS_ALLOWED_ORIGINS`; with `DJANGO_DEBUG=True` every origin is allowed). Opening the HTML files directly with `file://` is not recommended.

### 4. First run

1. Register a **company** account, then log in.
2. Complete the company profile and create a job posting (status "published").
3. Register a **job seeker** account in another browser or private window, fill in the profile, open the job and apply.
4. Log in as the company again and change the application status from "Received applications".

## Pages

| Page | Role | Purpose |
|---|---|---|
| `login.html`, `register.html` | Everyone | Sign in / create an account |
| `dashboard.html` | Both | Statistics: postings and received applications (company), sent applications (job seeker) |
| `jobs.html` | Both | Search, filter and paginate postings; companies can show only their own, including drafts |
| `job-detail.html` | Both | Posting details; apply form for job seekers; edit, delete and view-applications buttons for the owner |
| `job-form.html` | Company | Create or edit a posting |
| `applications.html` | Both | Sent applications (job seeker) or received applications (company); `?job=<id>` filters by posting |
| `application-detail.html` | Both | Cover letter, resume and status history; company changes status and notes, job seeker withdraws |
| `profile.html` | Both | Job seeker or company profile, with resume or logo upload |
| `change-password.html` | Both | Change password |

Pages are connected with normal links, and ids are passed as query parameters (for example `job-detail.html?id=5`).

## How it works

- **Page rendering.** Every page contains an empty `#app-shell`. The page script calls `renderShell()`, which builds the sidebar and top bar and then fills `#page-content` using template strings.
- **API calls.** All requests go through `apiFetch(path, options)` in `js/api.js`. It adds the `Authorization: Bearer` header, sends JSON or `FormData`, parses the response and throws an `Error` with a Persian message on failure.
- **Token refresh.** On a `401` response, `apiFetch` uses the refresh token once to get a new access token and repeats the request. If that fails, tokens are cleared and the user is sent to the login page.
- **Access control.** `requireAuth()` redirects visitors without a token to the login page, and `requireRole("company")` blocks the wrong role. These checks only improve the user experience; the real permissions are enforced by the API.
- **Localization.** `errors-fa.js` maps the API's English error messages to Persian, `ui.js` converts digits to Persian with a `MutationObserver` (inputs and textareas are skipped so submitted data is unchanged), and `jalali.js` shows Jalali dates while the API keeps storing ISO dates.
- **Styling.** `css/style.css` defines colors, radius and shadows as CSS variables, uses `direction: rtl`, and adapts to small screens below 800 px.

## Notes and limitations

- Tokens are kept in `localStorage`. Server data is inserted into pages with `innerHTML`, so values should be escaped before being rendered if untrusted users can enter content.
- The applications list shows only the first page returned by the API (10 items).
- The Jalali conversion table covers a limited range of years (up to about 1473).
- The Vazirmatn font is loaded from Google Fonts, so an internet connection is needed for the font; otherwise the browser falls back to Tahoma.
