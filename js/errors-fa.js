const FIELD_LABELS_FA = {
  email: "ایمیل",
  username: "نام کاربری",
  password: "رمز عبور",
  password_confirm: "تکرار رمز عبور",
  old_password: "رمز عبور فعلی",
  new_password: "رمز عبور جدید",
  role: "نوع حساب کاربری",
  phone_number: "شماره تماس",
  job: "آگهی شغلی",
  cover_letter: "متن انگیزه‌نامه",
  resume_snapshot: "فایل رزومه",
  resume_file: "فایل رزومه",
  status: "وضعیت",
  company_notes: "یادداشت داخلی",
  title: "عنوان شغل",
  description: "توضیحات",
  location: "محل کار",
  salary_min: "حداقل حقوق",
  salary_max: "حداکثر حقوق",
  category: "دسته‌بندی",
  company_name: "نام شرکت",
  vacancies: "تعداد نیرو موردنیاز",
  application_deadline: "مهلت ارسال درخواست",
  non_field_errors: "",
  detail: "",
};


const MESSAGE_TRANSLATIONS = [
  [/this password is too short.*?(\d+) characters/i, (m) => `رمز عبور باید حداقل ${m[1]} کاراکتر داشته باشد.`],
  [/this password is too common/i, "این رمز عبور بسیار رایج و ساده است؛ رمز دیگری انتخاب کنید."],
  [/this password is entirely numeric/i, "رمز عبور نباید فقط شامل عدد باشد."],
  [/password is too similar to the (.+)/i, (m) => `رمز عبور نباید شبیه به ${FIELD_LABELS_FA[m[1].trim()] || m[1]} شما باشد.`],
  [/passwords do not match/i, "رمز عبور و تکرار آن با هم یکسان نیستند."],
  [/incorrect password/i, "رمز عبور فعلی وارد شده اشتباه است."],

  [/no active account found with the given credentials/i, "ایمیل یا رمز عبور اشتباه است."],
  [/role must be 'jobseeker' or 'company'/i, "نوع حساب باید «کارجو» یا «شرکت» باشد."],
  [/user with this email already exists/i, "این ایمیل قبلاً ثبت‌نام کرده است."],
  [/this field must be unique/i, "این مقدار قبلاً استفاده شده است."],

  [/you have already applied to this job/i, "شما قبلاً برای این آگهی درخواست داده‌اید."],
  [/this job posting is not open for applications/i, "این آگهی دیگر درخواست جدید نمی‌پذیرد."],
  [/salary_min cannot be greater than salary_max/i, "حداقل حقوق نباید بیشتر از حداکثر حقوق باشد."],
  [/invalid status/i, "وضعیت انتخاب‌شده معتبر نیست."],

  [/this field may not be blank/i, "این فیلد نباید خالی باشد."],
  [/this field is required/i, "پر کردن این فیلد الزامی است."],
  [/enter a valid email address/i, "لطفاً یک ایمیل معتبر وارد کنید."],
  [/a valid integer is required/i, "لطفاً یک عدد صحیح وارد کنید."],
  [/a valid number is required/i, "لطفاً یک عدد معتبر وارد کنید."],
  [/ensure this value is greater than or equal to (\d+)/i, (m) => `مقدار باید حداقل ${m[1]} باشد.`],
  [/ensure this value is less than or equal to (\d+)/i, (m) => `مقدار باید حداکثر ${m[1]} باشد.`],
  [/ensure this field has no more than (\d+) characters/i, (m) => `این فیلد نباید بیشتر از ${m[1]} کاراکتر باشد.`],
  [/not found\.?$/i, "موردی با این مشخصات پیدا نشد."],
  [/invalid token/i, "نشست شما نامعتبر یا منقضی شده است. دوباره وارد شوید."],
  [/token is blacklisted/i, "این نشست قبلاً پایان یافته است. دوباره وارد شوید."],
  [/authentication credentials were not provided/i, "برای این کار باید وارد حساب کاربری خود شوید."],
  [/you do not have permission to perform this action/i, "شما اجازه‌ی انجام این کار را ندارید."],
  [/a user with that username already exists\.?/i, "این نام کاربری قبلاً ثبت شده است."],
  [/Enter a valid URL./i, "آدرس وب سایت معتبر نیست."],
  [/Location is required unless the job is remote./i, "آدرس شرکت برای موقعیت های شغلی که دورکاری نیستند الزامی هستند. آدرس شرکت را در بخش پروفایل تکمیل کنید."],
  [/No JobApplication matches the given query./i, "چنین درخواست شغلی وجود ندارد."],
  [/the application deadline for this job has passed/i, "مهلت ارسال درخواست برای این آگهی به پایان رسیده است."],
  [/application deadline cannot be in the past/i, "مهلت ارسال درخواست نمی‌تواند تاریخی در گذشته باشد."],
  
];


function translateMessage(message) {
  if (typeof message !== "string") return String(message);

  for (const [pattern, replacement] of MESSAGE_TRANSLATIONS) {
    const match = message.match(pattern);
    if (match) {
      return typeof replacement === "function" ? replacement(match) : replacement;
    }
  }
  return message; 
}


function extractErrorMessageFa(data) {
  if (!data) return "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
  if (typeof data === "string") return translateMessage(data);
  if (data.detail) return translateMessage(data.detail);

  const parts = [];
  for (const key in data) {
    const rawMessages = Array.isArray(data[key]) ? data[key] : [data[key]];
    const translated = rawMessages.map((m) => translateMessage(String(m))).join(" ");
    parts.push(translated);
  }
  return parts.join(" | ") || "خطایی رخ داد.";
}
