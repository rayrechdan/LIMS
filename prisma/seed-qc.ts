import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function gauss() { // standard normal via Box-Muller
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

async function main() {
  console.log("🌱 Seeding instruments and QC data…");

  // ─── INSTRUMENTS ───
  const instruments = [
    {
      serialNumber: "SX-XN1000-2841",
      name: "Sysmex XN-1000",
      model: "XN-1000",
      manufacturer: "Sysmex",
      category: "HEMATOLOGY",
      status: "ONLINE",
      location: "Beirut Central · Hematology Lab",
      ipAddress: "192.168.10.21",
      installedAt: new Date("2023-06-15"),
      warrantyUntil: new Date("2027-06-15"),
      lastCalibrationAt: new Date(Date.now() - 5 * 86400000),
      nextMaintenanceAt: new Date(Date.now() + 25 * 86400000),
      testCodes: "CBC",
      notes: "5-part differential hematology analyzer",
    },
    {
      serialNumber: "RC-C311-9921",
      name: "Roche cobas c311",
      model: "cobas c311",
      manufacturer: "Roche Diagnostics",
      category: "CHEMISTRY",
      status: "ONLINE",
      location: "Beirut Central · Chemistry Lab",
      ipAddress: "192.168.10.22",
      installedAt: new Date("2022-11-02"),
      warrantyUntil: new Date("2026-11-02"),
      lastCalibrationAt: new Date(Date.now() - 12 * 86400000),
      nextMaintenanceAt: new Date(Date.now() + 8 * 86400000),
      testCodes: "BMP,LIPID",
      notes: "Clinical chemistry analyzer",
    },
    {
      serialNumber: "BR-D10-5512",
      name: "Bio-Rad D-10",
      model: "D-10",
      manufacturer: "Bio-Rad",
      category: "CHEMISTRY",
      status: "MAINTENANCE",
      location: "Beirut Central · Endocrine Lab",
      ipAddress: "192.168.10.23",
      installedAt: new Date("2024-03-20"),
      warrantyUntil: new Date("2028-03-20"),
      lastCalibrationAt: new Date(Date.now() - 30 * 86400000),
      nextMaintenanceAt: new Date(Date.now() - 2 * 86400000),
      testCodes: "HBA1C",
      notes: "HbA1c HPLC analyzer — scheduled preventive maintenance in progress",
    },
    {
      serialNumber: "AB-CIA-7283",
      name: "Abbott Architect i1000SR",
      model: "i1000SR",
      manufacturer: "Abbott",
      category: "IMMUNOASSAY",
      status: "ONLINE",
      location: "Beirut Central · Immunoassay Lab",
      ipAddress: "192.168.10.24",
      installedAt: new Date("2023-01-10"),
      warrantyUntil: new Date("2027-01-10"),
      lastCalibrationAt: new Date(Date.now() - 3 * 86400000),
      nextMaintenanceAt: new Date(Date.now() + 45 * 86400000),
      testCodes: "TSH",
      notes: "Chemiluminescent immunoassay analyzer",
    },
    {
      serialNumber: "BE-URI-3340",
      name: "Beckman iQ200 Sprint",
      model: "iQ200 Sprint",
      manufacturer: "Beckman Coulter",
      category: "GENERAL",
      status: "OFFLINE",
      location: "Jounieh Branch · Urinalysis",
      ipAddress: "192.168.20.18",
      installedAt: new Date("2021-09-05"),
      warrantyUntil: new Date("2025-09-05"),
      lastCalibrationAt: new Date(Date.now() - 60 * 86400000),
      nextMaintenanceAt: new Date(Date.now() - 10 * 86400000),
      testCodes: "UA",
      notes: "Currently offline — connectivity issue under investigation",
    },
    {
      serialNumber: "BD-PHX-1102",
      name: "BD Phoenix M50",
      model: "Phoenix M50",
      manufacturer: "Becton Dickinson",
      category: "MICROBIOLOGY",
      status: "ONLINE",
      location: "Beirut Central · Microbiology",
      ipAddress: "192.168.10.25",
      installedAt: new Date("2024-01-15"),
      warrantyUntil: new Date("2028-01-15"),
      lastCalibrationAt: new Date(Date.now() - 7 * 86400000),
      nextMaintenanceAt: new Date(Date.now() + 60 * 86400000),
      testCodes: "UCULT",
      notes: "Automated identification and AST system",
    },
  ];

  const instrumentMap = new Map<string, string>();
  for (const ins of instruments) {
    const created = await db.instrument.upsert({
      where: { serialNumber: ins.serialNumber },
      update: {},
      create: ins,
    });
    instrumentMap.set(ins.serialNumber, created.id);
  }

  // ─── INSTRUMENT EVENTS (history) ───
  for (const ins of instruments) {
    const id = instrumentMap.get(ins.serialNumber)!;
    const existing = await db.instrumentEvent.count({ where: { instrumentId: id } });
    if (existing > 0) continue;

    const events: { type: string; title: string; description?: string; performedBy: string; timestamp: Date }[] = [
      { type: "INSTALL", title: "Initial installation and validation", performedBy: "Field Engineer", timestamp: ins.installedAt },
      { type: "CALIBRATION", title: "Routine calibration", performedBy: "Omar Haddad", timestamp: new Date(ins.installedAt.getTime() + 30 * 86400000) },
      { type: "MAINTENANCE", title: "Quarterly preventive maintenance", performedBy: "Field Engineer", timestamp: new Date(ins.installedAt.getTime() + 90 * 86400000) },
      { type: "CALIBRATION", title: "Calibration after reagent lot change", performedBy: "Omar Haddad", timestamp: new Date(Date.now() - 30 * 86400000) },
      { type: "CALIBRATION", title: "Routine calibration", performedBy: "Omar Haddad", timestamp: ins.lastCalibrationAt },
    ];
    if (ins.status === "MAINTENANCE") {
      events.push({ type: "MAINTENANCE", title: "Scheduled PM started", performedBy: "Field Engineer", timestamp: new Date(Date.now() - 2 * 86400000) });
    }
    if (ins.status === "OFFLINE") {
      events.push({ type: "STATUS_CHANGE", title: "Instrument went offline", description: "Connectivity lost", performedBy: "System", timestamp: new Date(Date.now() - 1 * 86400000) });
    }

    await db.instrumentEvent.createMany({
      data: events.map((e) => ({
        instrumentId: id,
        type: e.type,
        title: e.title,
        description: e.description || null,
        performedBy: e.performedBy,
        timestamp: e.timestamp,
      })),
    });
  }

  // ─── QC MATERIALS ───
  const materials = [
    { name: "Bio-Rad Lyphochek L1", lot: "LOT-44521", level: "LOW", manufacturer: "Bio-Rad", expiryDate: new Date("2026-12-31") },
    { name: "Bio-Rad Lyphochek L2", lot: "LOT-44521", level: "NORMAL", manufacturer: "Bio-Rad", expiryDate: new Date("2026-12-31") },
    { name: "Bio-Rad Lyphochek L3", lot: "LOT-44521", level: "HIGH", manufacturer: "Bio-Rad", expiryDate: new Date("2026-12-31") },
  ];

  const materialMap = new Map<string, string>();
  for (const m of materials) {
    const created = await db.qCMaterial.upsert({
      where: { lot_level: { lot: m.lot, level: m.level } },
      update: {},
      create: m,
    });
    materialMap.set(m.level, created.id);
  }

  // ─── QC TARGETS + RUNS ───
  // Pick a few CBC parameters for QC
  const cbc = await db.test.findUnique({ where: { code: "CBC" }, include: { parameters: true } });
  if (!cbc) {
    console.log("No CBC test found, skipping QC runs");
    return;
  }

  const qcParams = [
    { code: "WBC", normalMean: 7.4, normalSD: 0.18, lowMean: 3.6, lowSD: 0.12, highMean: 16.8, highSD: 0.35 },
    { code: "RBC", normalMean: 5.10, normalSD: 0.10, lowMean: 3.40, lowSD: 0.08, highMean: 6.40, highSD: 0.14 },
    { code: "HGB", normalMean: 14.6, normalSD: 0.30, lowMean: 9.5, lowSD: 0.22, highMean: 18.2, highSD: 0.42 },
    { code: "HCT", normalMean: 44.0, normalSD: 0.85, lowMean: 28.5, lowSD: 0.55, highMean: 54.0, highSD: 1.05 },
    { code: "PLT", normalMean: 245, normalSD: 8, lowMean: 92, lowSD: 5, highMean: 565, highSD: 14 },
  ];

  const sysmexId = instrumentMap.get("SX-XN1000-2841")!;
  const technicians = ["Omar Haddad", "Lina Saad", "Karim Mansour"];

  for (const qp of qcParams) {
    const param = cbc.parameters.find((p) => p.code === qp.code);
    if (!param) continue;

    for (const level of ["LOW", "NORMAL", "HIGH"] as const) {
      const materialId = materialMap.get(level)!;
      const mean = level === "LOW" ? qp.lowMean : level === "NORMAL" ? qp.normalMean : qp.highMean;
      const sd = level === "LOW" ? qp.lowSD : level === "NORMAL" ? qp.normalSD : qp.highSD;

      // Create target
      await db.qCTarget.upsert({
        where: { materialId_parameterId: { materialId, parameterId: param.id } },
        update: {},
        create: { materialId, parameterId: param.id, mean, sd },
      });

      // Skip if runs already exist
      const existing = await db.qCRun.count({ where: { materialId, parameterCode: qp.code } });
      if (existing > 0) continue;

      // Generate 30 runs over the past 30 days, mostly in-range with intentional violations
      const now = Date.now();
      for (let i = 0; i < 30; i++) {
        const dayOffset = 29 - i;
        const runAt = new Date(now - dayOffset * 86400000 + rand(8, 16) * 3600000);

        let z = gauss(); // mostly within ±2

        // Inject intentional violations for the NORMAL level + HGB to make the LJ chart interesting
        if (level === "NORMAL" && qp.code === "HGB") {
          if (i === 8) z = 2.4;       // 1-2s warning
          if (i === 9) z = 2.5;       // 2-2s violation
          if (i === 18) z = -3.2;     // 1-3s violation
          if (i === 22) z = 2.7;
          if (i === 23) z = -2.6;     // R-4s
        }
        if (level === "NORMAL" && qp.code === "WBC") {
          if (i === 14) z = 2.3;
          if (i === 15) z = 2.1;      // 2-2s
        }

        const value = +(mean + z * sd).toFixed(2);
        const cv = +((sd / mean) * 100).toFixed(2);

        let status = "IN_RANGE";
        let westgardRule: string | null = null;
        if (Math.abs(z) >= 3) { status = "OUT_OF_RANGE"; westgardRule = "1_3s"; }
        else if (Math.abs(z) >= 2) { status = "WARNING"; westgardRule = "1_2s"; }

        await db.qCRun.create({
          data: {
            materialId,
            parameterId: param.id,
            parameterCode: qp.code,
            parameterName: param.name,
            unit: param.unit,
            instrumentId: sysmexId,
            value,
            mean,
            sd,
            zScore: +z.toFixed(2),
            cv,
            status,
            westgardRule,
            technicianName: technicians[i % technicians.length],
            actionTaken: status === "OUT_OF_RANGE" ? "Recalibrated and repeated" : status === "WARNING" ? "Flagged, repeated successfully" : null,
            runAt,
          },
        });
      }
    }
  }

  // Apply post-hoc Westgard pattern detection for 2_2s
  const hgbNormalRuns = await db.qCRun.findMany({
    where: { parameterCode: "HGB", material: { level: "NORMAL" } },
    orderBy: { runAt: "asc" },
  });
  for (let i = 1; i < hgbNormalRuns.length; i++) {
    const a = hgbNormalRuns[i - 1];
    const b = hgbNormalRuns[i];
    if (a.zScore >= 2 && b.zScore >= 2) {
      await db.qCRun.update({ where: { id: b.id }, data: { westgardRule: "2_2s", status: "OUT_OF_RANGE" } });
    }
    if (a.zScore <= -2 && b.zScore <= -2) {
      await db.qCRun.update({ where: { id: b.id }, data: { westgardRule: "2_2s", status: "OUT_OF_RANGE" } });
    }
    if ((a.zScore >= 2 && b.zScore <= -2) || (a.zScore <= -2 && b.zScore >= 2)) {
      await db.qCRun.update({ where: { id: b.id }, data: { westgardRule: "R_4s", status: "OUT_OF_RANGE" } });
    }
  }

  console.log("✅ QC + instruments seed complete");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
