import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { FestivalHeader } from "@/components/FestivalHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Footer } from "@/components/Footer";
import { X } from "lucide-react";
import { getTicketSettings, type TicketSettings } from "@/lib/ticketSettings";
import { checkRoleAvailability, getRemainingTickets, getRemainingEarlyBirdTickets, getRemainingNormalTickets, getRemainingFastBunnyTickets, getRemainingTotalSoliTickets } from "@/lib/ticketPurchases";

const Tickets = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [earlyBirdRole, setEarlyBirdRole] = useState<string>("");
  const [fastBunnyRole, setFastBunnyRole] = useState<string>("");
  const [normalRole, setNormalRole] = useState<string>("");
  const [earlyBirdReducedRole, setEarlyBirdReducedRole] = useState<string>("");
  const [fastBunnyReducedRole, setFastBunnyReducedRole] = useState<string>("");
  const [normalReducedRole, setNormalReducedRole] = useState<string>("");
  const [ticketSettings, setTicketSettings] = useState<TicketSettings | null>(null);
  const [roleAvailability, setRoleAvailability] = useState<Record<string, boolean>>({});
  const [remainingTickets, setRemainingTickets] = useState<Record<string, { early: number | null; fastBunny: number | null; normal: number | null }>>({});
  const [remainingEarlyBirdTickets, setRemainingEarlyBirdTickets] = useState<number | null>(null);
  const [remainingFastBunnyTickets, setRemainingFastBunnyTickets] = useState<number | null>(null);
  const [remainingNormalTickets, setRemainingNormalTickets] = useState<number | null>(null);
  const [remainingTotalSoliTickets, setRemainingTotalSoliTickets] = useState<number | null>(null);

  const limitFieldEarlyByRole: Record<string, keyof TicketSettings> = {
    bar: "bar_limit_early",
    kuechenhilfe: "kuechenhilfe_limit_early",
    springerRunner: "springer_runner_limit_early",
    springerToilet: "springer_toilet_limit_early",
    abbau: "abbau_limit_early",
    aufbau: "aufbau_limit_early",
    awareness: "awareness_limit_early",
    tech: "tech_limit_early",
  };
  const limitFieldNormalByRole: Record<string, keyof TicketSettings> = {
    bar: "bar_limit_normal",
    kuechenhilfe: "kuechenhilfe_limit_normal",
    springerRunner: "springer_runner_limit_normal",
    springerToilet: "springer_toilet_limit_normal",
    abbau: "abbau_limit_normal",
    aufbau: "aufbau_limit_normal",
    awareness: "awareness_limit_normal",
    tech: "tech_limit_normal",
  };
  const limitFieldFastBunnyByRole: Record<string, keyof TicketSettings> = {
    bar: "bar_limit_fast_bunny",
    kuechenhilfe: "kuechenhilfe_limit_fast_bunny",
    springerRunner: "springer_runner_limit_fast_bunny",
    springerToilet: "springer_toilet_limit_fast_bunny",
    abbau: "abbau_limit_fast_bunny",
    aufbau: "aufbau_limit_fast_bunny",
    awareness: "awareness_limit_fast_bunny",
    tech: "tech_limit_fast_bunny",
  };

  const priceFieldByRole: Record<string, { early: keyof TicketSettings; fastBunny: keyof TicketSettings; normal: keyof TicketSettings }> = {
    bar: { early: "bar_price_early", fastBunny: "bar_price_fast_bunny", normal: "bar_price_normal" },
    kuechenhilfe: { early: "kuechenhilfe_price_early", fastBunny: "kuechenhilfe_price_fast_bunny", normal: "kuechenhilfe_price_normal" },
    springerRunner: { early: "springer_runner_price_early", fastBunny: "springer_runner_price_fast_bunny", normal: "springer_runner_price_normal" },
    springerToilet: { early: "springer_toilet_price_early", fastBunny: "springer_toilet_price_fast_bunny", normal: "springer_toilet_price_normal" },
    abbau: { early: "abbau_price_early", fastBunny: "abbau_price_fast_bunny", normal: "abbau_price_normal" },
    aufbau: { early: "aufbau_price_early", fastBunny: "aufbau_price_fast_bunny", normal: "aufbau_price_normal" },
    awareness: { early: "awareness_price_early", fastBunny: "awareness_price_fast_bunny", normal: "awareness_price_normal" },
    tech: { early: "tech_price_early", fastBunny: "tech_price_fast_bunny", normal: "tech_price_normal" },
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getTicketSettings();
        setTicketSettings(settings);
        
        if (settings) {
          const availability: Record<string, boolean> = {};
          const remaining: Record<string, { early: number | null; fastBunny: number | null; normal: number | null }> = {};
          const allRoles = [
            'bar', 'kuechenhilfe', 'springerRunner', 'springerToilet',
            'abbau', 'aufbau', 'awareness', 'tech'
          ];

          await Promise.all(
            allRoles.map(async (role) => {
              const limitEarly = settings[limitFieldEarlyByRole[role]] as number | null | undefined;
              const limitNormal = settings[limitFieldNormalByRole[role]] as number | null | undefined;
              const limitFastBunny = settings[limitFieldFastBunnyByRole[role]] as number | null | undefined;
              const byType = await getRemainingTickets(role, limitEarly, limitNormal, limitFastBunny);
              remaining[role] = byType;
              availability[role] = (byType.early ?? 0) > 0 || (byType.fastBunny ?? 0) > 0 || (byType.normal ?? 0) > 0;
            })
          );

          setRoleAvailability(availability);
          setRemainingTickets(remaining);
        }

        // Load remaining total Soli-Contributions (all types combined)
        if (settings?.total_soli_limit !== null && settings?.total_soli_limit !== undefined) {
          const totalRemaining = await getRemainingTotalSoliTickets(settings.total_soli_limit);
          setRemainingTotalSoliTickets(totalRemaining);
        } else {
          setRemainingTotalSoliTickets(null);
        }

        // Load remaining early-bird tickets (separate from role availability)
        if (settings?.early_bird_total_limit !== null && settings?.early_bird_total_limit !== undefined) {
          const earlyBirdRemaining = await getRemainingEarlyBirdTickets(settings.early_bird_total_limit);
          setRemainingEarlyBirdTickets(earlyBirdRemaining);
        } else {
          setRemainingEarlyBirdTickets(null);
        }

        // Load remaining fast-bunny tickets (uses shared pool with Early Bird when fast_bunny_total_limit is null)
        if (settings?.fast_bunny_total_limit != null || settings?.early_bird_total_limit != null) {
          const fastBunnyRemaining = await getRemainingFastBunnyTickets(
            settings.fast_bunny_total_limit ?? null,
            settings.early_bird_total_limit ?? null
          );
          setRemainingFastBunnyTickets(fastBunnyRemaining);
        } else {
          setRemainingFastBunnyTickets(null);
        }

        // Load remaining normal-bird tickets (separate from role availability)
        if (settings?.normal_total_limit !== null && settings?.normal_total_limit !== undefined) {
          const normalRemaining = await getRemainingNormalTickets(settings.normal_total_limit);
          setRemainingNormalTickets(normalRemaining);
        } else {
          setRemainingNormalTickets(null);
        }
      } catch (error: any) {
        console.error('[Tickets] Error loading ticket settings:', error);
        // Don't show toast here as it's not critical - page can still function
        // Settings will be null and UI will handle it gracefully
      }
    };
    loadSettings();
  }, []);

  const standardRoles = [
    { value: "bar", label: t("bar") },              // Bar-Fee
    { value: "springerToilet", label: t("springerToilet") }, // Hygiene-Held:in
    { value: "kuechenhilfe", label: t("kuechenhilfe") },     // Küchen-Magier:in
    { value: "springerRunner", label: t("springerRunner") }, // Spring-Maus
  ];

  const reducedRoles = [
    { value: "awareness", label: t("awareness") },  // Care-Crew (Awareness)
    { value: "abbau", label: t("abbau") },          // Rebuild-Rescuer (Breakdown)
    { value: "aufbau", label: t("aufbau") },        // Setup-Ace (Build-Up)
    { value: "tech", label: t("techSupport") },     // Tech-Support
  ];

  // Roles to display in the main list (excluding those requiring experience)
  const reducedRolesMainList = [
    { value: "abbau", label: t("abbau") },
    { value: "aufbau", label: t("aufbau") },
  ];

  // Roles requiring experience / organiser consent
  const reducedRolesRequiringExperience = [
    { value: "awareness", label: t("awareness") },
    { value: "tech", label: t("techSupport") },
  ];

  // Helper function to get role description
  const getRoleDescription = (roleValue: string): string => {
    const descriptionMap: Record<string, string> = {
      bar: t("barDesc"),
      kuechenhilfe: t("kuechenhilfeDesc"),
      springerRunner: t("springerRunnerDesc"),
      springerToilet: t("springerToiletDesc"),
      abbau: t("abbauDesc"),
      aufbau: t("aufbauDesc"),
      awareness: t("awarenessDesc"),
      tech: t("techSupportDesc"),
    };
    return descriptionMap[roleValue] || "";
  };

  // Parsed reductions text (heading, bullet lines, footer) for better formatting
  const reductionsLines = t("reducedTicketTypeReductions")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);


  // Check if total Soli-Contributions are available (gates all types when total limit is set)
  const isTotalLimitReached = (): boolean => {
    if (ticketSettings?.total_soli_limit == null) return false;
    if (remainingTotalSoliTickets !== null && remainingTotalSoliTickets <= 0) return true;
    return false;
  };

  // Check if early bird tickets are available
  const isEarlyBirdAvailable = (): boolean => {
    if (isTotalLimitReached()) return false;
    if (!ticketSettings?.early_bird_enabled) return false;
    
    // Check cutoff date
    if (ticketSettings.early_bird_cutoff) {
      if (new Date(ticketSettings.early_bird_cutoff) <= new Date()) {
        return false;
      }
    }
    
    // Check total limit
    if (ticketSettings.early_bird_total_limit !== null && ticketSettings.early_bird_total_limit !== undefined) {
      // If we have the remaining count loaded, use it; otherwise return true (will be checked async)
      if (remainingEarlyBirdTickets !== null) {
        return remainingEarlyBirdTickets > 0;
      }
      // If count not loaded yet, assume available (will update when loaded)
      return true;
    }
    
    return true;
  };

  // Check if fast bunny tickets are available (includes shared pool with Early Bird when fast_bunny_total_limit is null)
  const isFastBunnyAvailable = (): boolean => {
    if (isTotalLimitReached()) return false;
    if (!ticketSettings?.fast_bunny_enabled) return false;

    if (ticketSettings.fast_bunny_cutoff) {
      if (new Date(ticketSettings.fast_bunny_cutoff) <= new Date()) {
        return false;
      }
    }

    if (ticketSettings.fast_bunny_total_limit != null || ticketSettings.early_bird_total_limit != null) {
      if (remainingFastBunnyTickets !== null) {
        return remainingFastBunnyTickets > 0;
      }
      return true;
    }

    return true;
  };

  // Check if normal-bird tickets are available
  const isNormalAvailable = (): boolean => {
    if (isTotalLimitReached()) return false;
    // Check total limit
    if (ticketSettings?.normal_total_limit !== null && ticketSettings?.normal_total_limit !== undefined) {
      // If we have the remaining count loaded, use it; otherwise return true (will be checked async)
      if (remainingNormalTickets !== null) {
        return remainingNormalTickets > 0;
      }
      // If count not loaded yet, assume available (will update when loaded)
      return true;
    }
    
    return true;
  };

  // Get price for a role and ticket type
  const getPrice = (role: string, type: 'early' | 'fastBunny' | 'normal'): string => {
    const fields = priceFieldByRole[role];
    if (ticketSettings && fields) {
      const priceField = type === 'early' ? fields.early : type === 'fastBunny' ? fields.fastBunny : fields.normal;
      const price = ticketSettings[priceField] as number | null | undefined;
      if (price !== null && price !== undefined) {
        return `${price.toFixed(2)}€`;
      }
    }
    return type === 'early' ? "100€" : type === 'fastBunny' ? "110€" : "120€";
  };

  // Get remaining tickets for a role (early, fast bunny, normal)
  const getRemainingForRole = (role: string): { early: number | null; fastBunny: number | null; normal: number | null } | null => {
    return remainingTickets[role] ?? null;
  };

  type TicketTypeKey = 'early' | 'fastBunny' | 'normal';

  const isRoleAvailableForType = (role: string, ticketType: TicketTypeKey): boolean => {
    const r = remainingTickets[role];
    if (!r) return true;
    // Normal Bird receives rollover from Early Bird and Fast Bunny, so a role available for
    // any other ticket type should also be available for Normal Bird.
    if (ticketType === 'normal') {
      return (r.early ?? 0) > 0 || (r.fastBunny ?? 0) > 0 || (r.normal ?? 0) > 0;
    }
    const remaining = ticketType === 'early' ? r.early : r.fastBunny;
    return (remaining ?? 0) > 0;
  };

  const hasAnyRoleAvailableForType = (roles: { value: string }[], ticketType: TicketTypeKey): boolean =>
    roles.some((r) => isRoleAvailableForType(r.value, ticketType));

  const handleChooseTicket = (type: string, role: string) => {
    if (!role) {
      // Could show a toast here
      return;
    }
    navigate(`/soli-beitrag/checkout?type=${type}&role=${role}`);
  };

  // Check if any dropdown has a selection
  const hasAnySelection = () => {
    return !!(earlyBirdRole || fastBunnyRole || normalRole || earlyBirdReducedRole || fastBunnyReducedRole || normalReducedRole);
  };

  // Check if a specific dropdown should be disabled (when another has selection, or when no roles available for this ticket type)
  const isDisabled = (currentValue: string, ticketType: TicketTypeKey, roles: { value: string }[]) =>
    (hasAnySelection() && !currentValue) || !hasAnyRoleAvailableForType(roles, ticketType);

  const handleRoleChange = (
    setter: (value: string) => void, 
    value: string,
    clearOthers: () => void
  ) => {
    if (value === "__clear__") {
      setter("");
    } else {
      // Clear all other selections before setting the new one
      clearOthers();
      setter(value);
    }
  };

  const handleClearSelection = (setter: (value: string) => void) => {
    setter("");
  };

  // Functions to clear all other dropdowns
  const clearAllExceptEarlyBird = () => {
    setFastBunnyRole("");
    setNormalRole("");
    setEarlyBirdReducedRole("");
    setFastBunnyReducedRole("");
    setNormalReducedRole("");
  };

  const clearAllExceptFastBunny = () => {
    setEarlyBirdRole("");
    setNormalRole("");
    setEarlyBirdReducedRole("");
    setFastBunnyReducedRole("");
    setNormalReducedRole("");
  };

  const clearAllExceptNormal = () => {
    setEarlyBirdRole("");
    setFastBunnyRole("");
    setEarlyBirdReducedRole("");
    setFastBunnyReducedRole("");
    setNormalReducedRole("");
  };

  const clearAllExceptEarlyBirdReduced = () => {
    setEarlyBirdRole("");
    setFastBunnyRole("");
    setNormalRole("");
    setFastBunnyReducedRole("");
    setNormalReducedRole("");
  };

  const clearAllExceptFastBunnyReduced = () => {
    setEarlyBirdRole("");
    setFastBunnyRole("");
    setNormalRole("");
    setEarlyBirdReducedRole("");
    setNormalReducedRole("");
  };

  const clearAllExceptNormalReduced = () => {
    setEarlyBirdRole("");
    setFastBunnyRole("");
    setNormalRole("");
    setEarlyBirdReducedRole("");
    setFastBunnyReducedRole("");
  };

  return (
    <div className="min-h-screen bg-background">
      <FestivalHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Festival Banner */}
          <div className="text-center py-4 md:py-6 px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6 tracking-tight">
              Kollektiv Spinnen Festival II
            </h1>
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              07.08.2026 - 09.08.2026
            </p>
          </div>

          {/* Ticket Types Explanation */}
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t("ticketTypesExplanation")}
              </CardTitle>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {t("ticketBirthdayIntro")}
              </p>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                {t("ticketTypesExplanationDesc")}
              </CardDescription>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("ticketTypesNote")}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("ticketTypesNoteAdditional")}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Standard Ticket Type */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("standardTicketType")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("standardTicketTypeDesc")}
                </p>
                <div className="mt-3 text-sm text-muted-foreground space-y-1">
                  {isEarlyBirdAvailable() && (
                    <p>{getPrice("bar", "early")} - {t("forTheEarlyBirdVariant")}</p>
                  )}
                  {isFastBunnyAvailable() && (
                    <p>{getPrice("bar", "fastBunny")} - {t("forTheFastBunnyVariant")}</p>
                  )}
                  <p>{getPrice("bar", "normal")} - {t("forTheNormalVariant")}</p>
                </div>
              </div>

              {/* Reduced Ticket Type */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("reducedTicketType")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("reducedTicketTypeDesc")}
                </p>
                <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {reductionsLines.length > 0 && (
                    <>
                      {/* Heading line */}
                      <p className="mb-2 whitespace-pre-line">
                        {reductionsLines[0]}
                      </p>

                      {/* Bullet lines (strip leading bullet char for proper <li> bullets) */}
                      {reductionsLines.length > 2 && (
                        <ul className="list-disc list-inside space-y-1">
                          {reductionsLines.slice(1, -1).map((line, index) => (
                            <li key={index}>
                              <span className="font-semibold">
                                {line.replace(/^•\s*/, "")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Footer line */}
                      {reductionsLines.length > 1 && (
                        <p className="mt-2 whitespace-pre-line">
                          {reductionsLines[reductionsLines.length - 1]}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* What is included */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("whatIsIncludedTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("whatIsIncludedDesc")}
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>{t("ticketIncludesAccess")}</li>
                  <li>{t("ticketIncludesSleeping")}</li>
                  <li>{t("ticketIncludesDrinks")}</li>
                  <li>{t("ticketIncludesMeals")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Standard Tickets Section */}
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t("standardTickets")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role Descriptions */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("roleDescriptions")}
                </h3>
                <ul className="text-sm text-muted-foreground space-y-3">
                  {standardRoles.map((role) => (
                    <li key={role.value} className="space-y-1">
                      <div className="font-semibold text-foreground">{role.label}</div>
                      <div className="text-muted-foreground pl-0">{getRoleDescription(role.value)}</div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Early Bird */}
              {isEarlyBirdAvailable() && (
                <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t("earlyBird")}
                      </h3>
                      {isAdmin && remainingEarlyBirdTickets !== null && (
                        <span className="text-sm font-medium text-muted-foreground">
                          ({remainingEarlyBirdTickets} {t("remaining")})
                        </span>
                      )}
                    </div>
                    {earlyBirdRole && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {getPrice(earlyBirdRole, "early")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Select
                        key={`earlyBird-${earlyBirdRole || 'empty'}`}
                        {...(earlyBirdRole ? { value: earlyBirdRole } : {})}
                        onValueChange={(value) => handleRoleChange(setEarlyBirdRole, value, clearAllExceptEarlyBird)}
                        disabled={isDisabled(earlyBirdRole, 'early', standardRoles)}
                      >
                        <SelectTrigger className="flex-1 pr-8" disabled={isDisabled(earlyBirdRole, 'early', standardRoles)}>
                          <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {standardRoles.map((role) => {
                            const isAvailable = isRoleAvailableForType(role.value, 'early');
                            const remaining = getRemainingForRole(role.value);
                            return (
                              <SelectItem
                                key={role.value}
                                value={role.value}
                                disabled={!isAvailable}
                                className={!isAvailable ? "text-muted-foreground opacity-50" : ""}
                              >
                                {role.label} {(() => {
                                  if (!isAvailable) {
                                    return `(${t("soldOut")})`;
                                  }
                                  if (isAdmin && remaining !== null) {
                                    const e = remaining.early ?? '∞';
                                    const f = remaining.fastBunny ?? '∞';
                                    const n = remaining.normal ?? '∞';
                                    return ` (${e} ${t("earlyBird")} / ${f} ${t("fastBunny")} / ${n} ${t("normal")} ${t("remaining")})`;
                                  }
                                  return '';
                                })()}
                              </SelectItem>
                            );
                          })}
                          {earlyBirdRole && (
                            <SelectItem value="__clear__" className="text-muted-foreground">
                              {t("clearSelection")}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {earlyBirdRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClearSelection(setEarlyBirdRole);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-festival-light/20 rounded-full z-10"
                          title={t("clearSelection")}
                        >
                          <X className="h-5 w-5 text-festival-light hover:text-festival-medium" />
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={() => handleChooseTicket("earlyBird", earlyBirdRole)}
                      disabled={!earlyBirdRole || !isRoleAvailableForType(earlyBirdRole, 'early')}
                      className="w-full sm:w-auto"
                    >
                      {t("chooseThisTicket")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Fast Bunny */}
              {isFastBunnyAvailable() && (
                <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t("fastBunny")}
                      </h3>
                      {isAdmin && remainingFastBunnyTickets !== null && (
                        <span className="text-sm text-muted-foreground">
                          ({remainingFastBunnyTickets} {t("remaining")})
                        </span>
                      )}
                    </div>
                    {fastBunnyRole && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {getPrice(fastBunnyRole, "fastBunny")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Select
                        key={`fastBunny-${fastBunnyRole || 'empty'}`}
                        {...(fastBunnyRole ? { value: fastBunnyRole } : {})}
                        onValueChange={(value) => handleRoleChange(setFastBunnyRole, value, clearAllExceptFastBunny)}
                        disabled={isDisabled(fastBunnyRole, 'fastBunny', standardRoles)}
                      >
                        <SelectTrigger className="flex-1 pr-8" disabled={isDisabled(fastBunnyRole, 'fastBunny', standardRoles)}>
                          <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {standardRoles.map((role) => {
                            const isAvailable = isRoleAvailableForType(role.value, 'fastBunny');
                            const remaining = getRemainingForRole(role.value);
                            return (
                              <SelectItem
                                key={role.value}
                                value={role.value}
                                disabled={!isAvailable}
                                className={!isAvailable ? "text-muted-foreground opacity-50" : ""}
                              >
                                {role.label} {(() => {
                                  if (!isAvailable) {
                                    return `(${t("soldOut")})`;
                                  }
                                  if (isAdmin && remaining !== null) {
                                    const e = remaining.early ?? '∞';
                                    const f = remaining.fastBunny ?? '∞';
                                    const n = remaining.normal ?? '∞';
                                    return ` (${e} ${t("earlyBird")} / ${f} ${t("fastBunny")} / ${n} ${t("normal")} ${t("remaining")})`;
                                  }
                                  return '';
                                })()}
                              </SelectItem>
                            );
                          })}
                          {fastBunnyRole && (
                            <SelectItem value="__clear__" className="text-muted-foreground">
                              {t("clearSelection")}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {fastBunnyRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClearSelection(setFastBunnyRole);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-festival-light/20 rounded-full z-10"
                          title={t("clearSelection")}
                        >
                          <X className="h-5 w-5 text-festival-light hover:text-festival-medium" />
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={() => handleChooseTicket("fastBunny", fastBunnyRole)}
                      disabled={!fastBunnyRole || !isRoleAvailableForType(fastBunnyRole, 'fastBunny')}
                      className="w-full sm:w-auto"
                    >
                      {t("chooseThisTicket")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Normal */}
              {isNormalAvailable() && (
                <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t("normal")}
                      </h3>
                      {isAdmin && remainingNormalTickets !== null && (
                        <span className="text-sm text-muted-foreground">
                          ({remainingNormalTickets} {t("remaining")})
                        </span>
                      )}
                    </div>
                    {normalRole && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {getPrice(normalRole, "normal")}
                      </span>
                    )}
                  </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Select 
                      key={`normal-${normalRole || 'empty'}`}
                      {...(normalRole ? { value: normalRole } : {})}
                      onValueChange={(value) => handleRoleChange(setNormalRole, value, clearAllExceptNormal)}
                      disabled={isDisabled(normalRole, 'normal', standardRoles)}
                    >
                      <SelectTrigger className="flex-1 pr-8" disabled={isDisabled(normalRole, 'normal', standardRoles)}>
                        <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {standardRoles.map((role) => {
                          const isAvailable = isRoleAvailableForType(role.value, 'normal');
                          const remaining = getRemainingForRole(role.value);
                          return (
                            <SelectItem 
                              key={role.value} 
                              value={role.value}
                              disabled={!isAvailable}
                              className={!isAvailable ? "text-muted-foreground opacity-50" : ""}
                            >
                              {role.label} {(() => {
                                if (!isAvailable) {
                                  return `(${t("soldOut")})`;
                                }
                                if (isAdmin && remaining !== null) {
                                  const e = remaining.early ?? '∞';
                                  const f = remaining.fastBunny ?? '∞';
                                  const n = remaining.normal ?? '∞';
                                  return ` (${e} ${t("earlyBird")} / ${f} ${t("fastBunny")} / ${n} ${t("normal")} ${t("remaining")})`;
                                }
                                return '';
                              })()}
                            </SelectItem>
                          );
                        })}
                          {normalRole && (
                          <SelectItem value="__clear__" className="text-muted-foreground">
                            {t("clearSelection")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {normalRole && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleClearSelection(setNormalRole);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-festival-light/20 rounded-full z-10"
                        title={t("clearSelection")}
                      >
                        <X className="h-5 w-5 text-festival-light hover:text-festival-medium" />
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => handleChooseTicket("normal", normalRole)}
                    disabled={!normalRole || !isRoleAvailableForType(normalRole, 'normal') || !isNormalAvailable()}
                    className="w-full sm:w-auto"
                  >
                    {t("chooseThisTicket")}
                  </Button>
                </div>
              </div>
              )}
            </CardContent>
          </Card>

          {/* Reduced Tickets Section */}
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t("reducedTickets")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role Descriptions */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("roleDescriptions")}
                </h3>
                <ul className="text-sm text-muted-foreground space-y-3 mb-4">
                  {reducedRolesMainList.map((role) => (
                    <li key={role.value} className="space-y-1">
                      <div className="font-semibold text-foreground">{role.label}</div>
                      <div className="text-muted-foreground pl-0">{getRoleDescription(role.value)}</div>
                      {role.value === "abbau" && (
                        <div className="text-foreground pl-2 mt-3 p-2 bg-festival-light/10 border border-festival-light/30 rounded-md font-medium italic">
                          {t("abbauRefundNote")}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                
                {/* Only with experience / organiser consent */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    {t("onlyWithExperience")}
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-3">
                    {reducedRolesRequiringExperience.map((role) => (
                      <li key={role.value} className="space-y-1">
                        <div className="font-semibold text-foreground">{role.label}</div>
                        <div className="text-muted-foreground pl-0">{getRoleDescription(role.value)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Early Bird */}
              {isEarlyBirdAvailable() && (
                <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t("earlyBird")}
                      </h3>
                      {isAdmin && remainingEarlyBirdTickets !== null && (
                        <span className="text-sm font-medium text-muted-foreground">
                          ({remainingEarlyBirdTickets} {t("remaining")})
                        </span>
                      )}
                    </div>
                    {earlyBirdReducedRole && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {getPrice(earlyBirdReducedRole, "early")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Select 
                        key={`earlyBirdReduced-${earlyBirdReducedRole || 'empty'}`}
                        {...(earlyBirdReducedRole ? { value: earlyBirdReducedRole } : {})}
                        onValueChange={(value) => handleRoleChange(setEarlyBirdReducedRole, value, clearAllExceptEarlyBirdReduced)}
                        disabled={isDisabled(earlyBirdReducedRole, 'early', reducedRoles)}
                      >
                        <SelectTrigger className="flex-1 pr-8" disabled={isDisabled(earlyBirdReducedRole, 'early', reducedRoles)}>
                          <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {reducedRoles.map((role) => {
                            const isAvailable = isRoleAvailableForType(role.value, 'early');
                            const remaining = getRemainingForRole(role.value);
                            return (
                              <SelectItem 
                                key={role.value} 
                                value={role.value}
                                disabled={!isAvailable}
                                className={!isAvailable ? "text-muted-foreground opacity-50" : ""}
                              >
                                {role.label} {(() => {
                                  if (!isAvailable) {
                                    return `(${t("soldOut")})`;
                                  }
                                  if (isAdmin && remaining !== null) {
                                    const e = remaining.early ?? '∞';
                                    const f = remaining.fastBunny ?? '∞';
                                    const n = remaining.normal ?? '∞';
                                    return ` (${e} ${t("earlyBird")} / ${f} ${t("fastBunny")} / ${n} ${t("normal")} ${t("remaining")})`;
                                  }
                                  return '';
                                })()}
                              </SelectItem>
                            );
                          })}
                          {earlyBirdReducedRole && (
                            <SelectItem value="__clear__" className="text-muted-foreground">
                              {t("clearSelection")}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {earlyBirdReducedRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClearSelection(setEarlyBirdReducedRole);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-festival-light/20 rounded-full z-10"
                          title={t("clearSelection")}
                        >
                          <X className="h-5 w-5 text-festival-light hover:text-festival-medium" />
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={() => handleChooseTicket("reducedEarlyBird", earlyBirdReducedRole)}
                      disabled={!earlyBirdReducedRole || !isRoleAvailableForType(earlyBirdReducedRole, 'early')}
                      className="w-full sm:w-auto"
                    >
                      {t("chooseThisTicket")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Fast Bunny (Reduced) */}
              {isFastBunnyAvailable() && (
                <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t("fastBunny")}
                      </h3>
                      {isAdmin && remainingFastBunnyTickets !== null && (
                        <span className="text-sm text-muted-foreground">
                          ({remainingFastBunnyTickets} {t("remaining")})
                        </span>
                      )}
                    </div>
                    {fastBunnyReducedRole && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {getPrice(fastBunnyReducedRole, "fastBunny")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Select
                        key={`fastBunnyReduced-${fastBunnyReducedRole || 'empty'}`}
                        {...(fastBunnyReducedRole ? { value: fastBunnyReducedRole } : {})}
                        onValueChange={(value) => handleRoleChange(setFastBunnyReducedRole, value, clearAllExceptFastBunnyReduced)}
                        disabled={isDisabled(fastBunnyReducedRole, 'fastBunny', reducedRoles)}
                      >
                        <SelectTrigger className="flex-1 pr-8" disabled={isDisabled(fastBunnyReducedRole, 'fastBunny', reducedRoles)}>
                          <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {reducedRoles.map((role) => {
                            const isAvailable = isRoleAvailableForType(role.value, 'fastBunny');
                            const remaining = getRemainingForRole(role.value);
                            return (
                              <SelectItem
                                key={role.value}
                                value={role.value}
                                disabled={!isAvailable}
                                className={!isAvailable ? "text-muted-foreground opacity-50" : ""}
                              >
                                {role.label} {(() => {
                                  if (!isAvailable) {
                                    return `(${t("soldOut")})`;
                                  }
                                  if (isAdmin && remaining !== null) {
                                    const e = remaining.early ?? '∞';
                                    const f = remaining.fastBunny ?? '∞';
                                    const n = remaining.normal ?? '∞';
                                    return ` (${e} ${t("earlyBird")} / ${f} ${t("fastBunny")} / ${n} ${t("normal")} ${t("remaining")})`;
                                  }
                                  return '';
                                })()}
                              </SelectItem>
                            );
                          })}
                          {fastBunnyReducedRole && (
                            <SelectItem value="__clear__" className="text-muted-foreground">
                              {t("clearSelection")}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {fastBunnyReducedRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClearSelection(setFastBunnyReducedRole);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-festival-light/20 rounded-full z-10"
                          title={t("clearSelection")}
                        >
                          <X className="h-5 w-5 text-festival-light hover:text-festival-medium" />
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={() => handleChooseTicket("reducedFastBunny", fastBunnyReducedRole)}
                      disabled={!fastBunnyReducedRole || !isRoleAvailableForType(fastBunnyReducedRole, 'fastBunny')}
                      className="w-full sm:w-auto"
                    >
                      {t("chooseThisTicket")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Normal */}
              {isNormalAvailable() && (
                <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t("normal")}
                      </h3>
                      {isAdmin && remainingNormalTickets !== null && (
                        <span className="text-sm text-muted-foreground">
                          ({remainingNormalTickets} {t("remaining")})
                        </span>
                      )}
                    </div>
                    {normalReducedRole && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {getPrice(normalReducedRole, "normal")}
                      </span>
                    )}
                  </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Select 
                      key={`normalReduced-${normalReducedRole || 'empty'}`}
                      {...(normalReducedRole ? { value: normalReducedRole } : {})}
                      onValueChange={(value) => handleRoleChange(setNormalReducedRole, value, clearAllExceptNormalReduced)}
                      disabled={isDisabled(normalReducedRole, 'normal', reducedRoles)}
                    >
                      <SelectTrigger className="flex-1 pr-8" disabled={isDisabled(normalReducedRole, 'normal', reducedRoles)}>
                        <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {reducedRoles.map((role) => {
                          const isAvailable = isRoleAvailableForType(role.value, 'normal');
                          const remaining = getRemainingForRole(role.value);
                          return (
                            <SelectItem 
                              key={role.value} 
                              value={role.value}
                              disabled={!isAvailable}
                              className={!isAvailable ? "text-muted-foreground opacity-50" : ""}
                              >
                                {role.label} {(() => {
                                  if (!isAvailable) {
                                    return `(${t("soldOut")})`;
                                  }
                                  if (isAdmin && remaining !== null) {
                                    const e = remaining.early ?? '∞';
                                    const f = remaining.fastBunny ?? '∞';
                                    const n = remaining.normal ?? '∞';
                                    return ` (${e} ${t("earlyBird")} / ${f} ${t("fastBunny")} / ${n} ${t("normal")} ${t("remaining")})`;
                                  }
                                  return '';
                                })()}
                              </SelectItem>
                            );
                          })}
                          {normalReducedRole && (
                          <SelectItem value="__clear__" className="text-muted-foreground">
                            {t("clearSelection")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {normalReducedRole && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleClearSelection(setNormalReducedRole);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-festival-light/20 rounded-full z-10"
                        title={t("clearSelection")}
                      >
                        <X className="h-5 w-5 text-festival-light hover:text-festival-medium" />
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => handleChooseTicket("reducedNormal", normalReducedRole)}
                    disabled={!normalReducedRole || !isRoleAvailableForType(normalReducedRole, 'normal') || !isNormalAvailable()}
                    className="w-full sm:w-auto"
                  >
                    {t("chooseThisTicket")}
                  </Button>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-festival-light/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-festival-medium/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-1/2 w-80 h-80 bg-festival-deep/20 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      </div>

      <Footer />
    </div>
  );
};

export default Tickets;
