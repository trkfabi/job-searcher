export const CONFIG = {
  keywords: (
    process.env.KEYWORDS ||
    "node,express,typescript,javascript,php,react native,titanium"
  )
    .split(/[,|]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  minSalaryEur: Number(process.env.MIN_SALARY_EUR || 50000),
  euTimezones: (process.env.EU_TIMEZONES || "UTC,UTC+1,UTC+2")
    .split(",")
    .map((s) => s.trim()),
  allowUSRemote:
    String(process.env.ALLOW_US_REMOTE || "true").toLowerCase() === "true",
  outputDir: process.env.OUTPUT_DIR || "./data/outputs",
  dbPath: process.env.DB_PATH || "./data/jobs.sqlite",
  profile: {
    name: process.env.YOUR_NAME || "Your Name",
    years: Number(process.env.YEARS_EXP || 15),
    backendImpact: process.env.BACKEND_IMPACT || "",
    mobileImpact: process.env.MOBILE_IMPACT || "",
  },

  allowedLocHints: (
    process.env.ALLOWED_LOCATION_HINTS ||
    "europe,eu,emea,worldwide,anywhere,us,americas"
  )
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  blockedLocHints: (
    process.env.BLOCKED_LOCATION_HINTS || "south africa,za,india"
  )
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
};
