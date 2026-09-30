// Objectif : garder l'applicabilité géographique déterministe avant la décision Jev.
export const IMPACTS = ["allowed", "conditional", "possibly_prohibited", "unclear"];
const PROFILES = new Set(["individual", "company", "collectivity", "farm"]);
const WATERS = new Set(["drinking", "surface", "groundwater"]);

export function site(input) {
  if (!input?.id || !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude) ||
      input.latitude < -90 || input.latitude > 90 || input.longitude < -180 || input.longitude > 180 ||
      !PROFILES.has(input.profile))
    throw new TypeError("Site needs id, valid coordinates and a valid profile");
  const waterTypes = [...(input.waterTypes || [])];
  if (!waterTypes.length || waterTypes.some((value) => !WATERS.has(value)))
    throw new TypeError("Site needs valid waterTypes");
  if (input.zoneIds != null && !Array.isArray(input.zoneIds))
    throw new TypeError("Site zoneIds must be an array of non-empty strings");
  const zoneIds = input.zoneIds || [];
  if (zoneIds.some((value) => typeof value !== "string" || !value.trim()))
    throw new TypeError("Site zoneIds must be an array of non-empty strings");
  return {
    id: String(input.id), latitude: input.latitude, longitude: input.longitude,
    profile: input.profile, waterTypes, zoneIds: [...new Set(zoneIds.map((value) => value.trim()))],
    activities: [...(input.activities || [])].map(String),
  };
}

export function restriction(input) {
  if (!input?.id || typeof input.zoneId !== "string" || !input.zoneId.trim() ||
      !input?.level || !input?.startsAt || !input?.sourceUrl)
    throw new TypeError("Restriction needs id, zoneId, level, startsAt and sourceUrl");
  const starts = new Date(input.startsAt);
  const ends = input.endsAt ? new Date(input.endsAt) : null;
  if (Number.isNaN(starts.valueOf()) || ends && Number.isNaN(ends.valueOf()))
    throw new TypeError("Restriction dates must be ISO dates");
  // A date-only end remains effective through that calendar day (UTC).
  if (ends && typeof input.endsAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.endsAt)) {
    if (ends.toISOString().slice(0, 10) !== input.endsAt)
      throw new TypeError("Restriction end date must be a valid ISO date");
    ends.setUTCHours(23, 59, 59, 999);
  }
  if (ends && ends < starts) throw new TypeError("Restriction endsAt must not precede startsAt");
  return {
    id: String(input.id), zoneId: input.zoneId.trim(), level: String(input.level),
    profiles: [...(input.profiles || [])], waterTypes: [...(input.waterTypes || [])],
    rules: [...(input.rules || [])].map(String), startsAt: starts.toISOString(),
    endsAt: ends?.toISOString() || null, sourceUrl: String(input.sourceUrl),
  };
}

export async function assessOperation(siteInput, operation, restrictionInput, provider, { at = new Date() } = {}) {
  const s = site(siteInput);
  const r = restriction(restrictionInput);
  const when = new Date(at);
  if (Number.isNaN(when.valueOf())) throw new TypeError("at must be a valid date");
  if (when < new Date(r.startsAt) || r.endsAt && when > new Date(r.endsAt))
    return { impact: "inactive", review: false, deterministic: true };
  if (r.profiles.length && !r.profiles.includes(s.profile))
    return { impact: "different_profile", review: false, deterministic: true };
  if (r.waterTypes.length && !r.waterTypes.some((value) => s.waterTypes.includes(value)))
    return { impact: "different_water_type", review: false, deterministic: true };
  if (!s.zoneIds.length)
    return { impact: "zone_unverified", review: true, deterministic: true, site: s, restriction: r };
  if (!s.zoneIds.includes(r.zoneId))
    return { impact: "different_zone", review: false, deterministic: true, site: s, restriction: r };

  const response = await provider.decide({
    state: { site: s, operation: String(operation), restriction: r },
    questions: { impact: {
      type: "choice",
      instructions: "Map the described operation to the supplied restriction rules only. possibly_prohibited means a rule appears to prohibit it; conditional means an exemption, schedule, threshold or reduction may apply.",
      criteria: {
        allowed: "No supplied rule restricts the operation",
        conditional: "A condition, exemption, schedule or reduction applies",
        possibly_prohibited: "A supplied rule appears to prohibit the operation",
        unclear: "The operation or rule is insufficiently specific",
      },
    } },
  });
  const answer = response.answers.impact;
  return {
    impact: answer.choice, probability: answer.probabilities[answer.choice],
    confidence: answer.confidence, review: true, deterministic: false,
    site: s, restriction: r, usage: response.usage,
  };
}
