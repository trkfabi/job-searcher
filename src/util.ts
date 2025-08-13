export type Job = {
  id: string;
  title: string;
  company: string;
  location?: string;
  remote: boolean;
  timezoneNote?: string;
  salaryEurMin?: number;
  salaryEurMax?: number;
  url: string;
  source: string;
  createdAt: string;
  description?: string;
};

export const normalizeMoneyToEur = (
  text?: string
): { min?: number; max?: number } => {
  if (!text) return {};
  const clean = text.replace(/[, \n\r\t]/g, "").toLowerCase();
  const isUsd = /\$|usd/.test(clean);
  const isGbp = /£|gbp/.test(clean);
  const nums = Array.from(clean.matchAll(/(\d{2,7})/g)).map((m) =>
    Number(m[1])
  );
  if (!nums.length) return {};
  const [min, max] = nums.length >= 2 ? [nums[0], nums[1]] : [nums[0], nums[0]];
  const fx = isUsd ? 0.92 : isGbp ? 1.18 : 1;
  return { min: Math.round(min * fx), max: Math.round(max * fx) };
};

export const textMatches = (text: string, keywords: string[]) => {
  const hay = (text || "").toLowerCase();
  return keywords.some((k) => hay.includes(k));
};

export const passesGeoPolicy = (
  text: string,
  allowUSRemote: boolean
): boolean => {
  const hay = (text || "").toLowerCase();
  const euHints =
    /(europe|eu timezone|emea|cet|cest|utc\+?\s*[0-2]|spain|portugal|italy|germany)/.test(
      hay
    );
  const worldwide =
    /(worldwide|global|anywhere|remote anywhere|international)/.test(hay);
  const usOnly =
    /(us\s*only|must be (located|based) in the us|us citizens? only|green\s*card required|work authorization in the us required|authorized to work in the us only)/.test(
      hay
    );
  const locationHard = /(on-site|onsite only)/.test(hay);
  if (locationHard) return false;
  if (usOnly) return false;
  if (euHints || worldwide) return true;
  if (
    allowUSRemote &&
    /remote.*(us|americas|est|pst|cst|mst)/.test(hay) &&
    !usOnly
  )
    return true;
  return true;
};

export type JobWithScore = Job & {
  score: number;
  scoreDetails: { reason: string; delta: number }[];
};

export const regionAllowed = (
  text: string,
  allowed: string[],
  blocked: string[],
  preferredCountry?: string
) => {
  const hay = (text || "").toLowerCase();

  // Bloqueados explícitos
  if (blocked.some((b) => b && hay.includes(b))) return false;

  // Pasa siempre si menciona worldwide o anywhere
  if (/(worldwide|anywhere)/.test(hay)) return true;

  // Pasa si menciona el país preferido (Spain)
  if (preferredCountry && hay.includes(preferredCountry.toLowerCase()))
    return true;

  // Pasa si menciona Europe/EU/Emea
  if (/(europe|eu|emea|european)/.test(hay)) return true;

  // Si menciona otro país que no es el preferido → fuera
  const countryHints =
    /(germany|france|italy|netherlands|belgium|portugal|sweden|norway|finland|denmark|poland|romania|czech|austria|switzerland|uk|ireland)/;
  if (
    countryHints.test(hay) &&
    (!preferredCountry || !hay.includes(preferredCountry.toLowerCase()))
  )
    return false;

  // Si no hay pistas de región, lo aceptamos por defecto
  return true;
};
