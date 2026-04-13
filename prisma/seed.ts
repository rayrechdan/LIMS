import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding LIMS database…");

  // ─── USERS ───
  const passwordHash = await bcrypt.hash("admin123", 10);
  const techHash = await bcrypt.hash("tech123", 10);
  const docHash = await bcrypt.hash("doctor123", 10);
  const patientHash = await bcrypt.hash("patient123", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@lab.com" },
    update: {},
    create: {
      email: "admin@lab.com",
      passwordHash,
      firstName: "Sarah",
      lastName: "Admin",
      role: "ADMIN",
      department: "Administration",
    },
  });

  const pathologist = await db.user.upsert({
    where: { email: "pathologist@lab.com" },
    update: {},
    create: {
      email: "pathologist@lab.com",
      passwordHash: await bcrypt.hash("path123", 10),
      firstName: "Dr. Hala",
      lastName: "Khoury",
      role: "PATHOLOGIST",
      department: "Pathology",
      licenseNo: "LB-PATH-2284",
    },
  });

  const tech = await db.user.upsert({
    where: { email: "tech@lab.com" },
    update: {},
    create: {
      email: "tech@lab.com",
      passwordHash: techHash,
      firstName: "Omar",
      lastName: "Haddad",
      role: "TECHNICIAN",
      department: "Hematology",
    },
  });

  const reception = await db.user.upsert({
    where: { email: "reception@lab.com" },
    update: {},
    create: {
      email: "reception@lab.com",
      passwordHash: await bcrypt.hash("recep123", 10),
      firstName: "Lina",
      lastName: "Saad",
      role: "RECEPTIONIST",
      department: "Front Desk",
    },
  });

  const doctorUser = await db.user.upsert({
    where: { email: "doctor@lab.com" },
    update: {},
    create: {
      email: "doctor@lab.com",
      passwordHash: docHash,
      firstName: "Karim",
      lastName: "Mansour",
      role: "DOCTOR",
    },
  });

  const patientUser = await db.user.upsert({
    where: { email: "patient@lab.com" },
    update: {},
    create: {
      email: "patient@lab.com",
      passwordHash: patientHash,
      firstName: "Nour",
      lastName: "El-Amin",
      role: "PATIENT",
    },
  });

  // ─── LAB SETTINGS ───
  await db.labSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      labName: "Klev Diagnostic Laboratory",
      labNameAr: "مختبر كليف للتشخيص",
      address: "Hamra Street, Beirut, Lebanon",
      phone: "+961 1 234 567",
      email: "info@klevlab.com",
      licenseNumber: "LB-LAB-2024-0042",
      defaultTimezone: "Asia/Beirut",
    },
  });

  // ─── DOCTORS ───
  const drMansour = await db.doctor.upsert({
    where: { id: "dr-mansour" },
    update: {},
    create: {
      id: "dr-mansour",
      firstName: "Karim",
      lastName: "Mansour",
      specialty: "Internal Medicine",
      licenseNo: "LB-MD-9821",
      phone: "+961 3 456 789",
      clinic: "Beirut Medical Center",
      userId: doctorUser.id,
    },
  });

  await db.doctor.upsert({
    where: { id: "dr-fares" },
    update: {},
    create: {
      id: "dr-fares",
      firstName: "Yara",
      lastName: "Fares",
      specialty: "Endocrinology",
      licenseNo: "LB-MD-7733",
      phone: "+961 3 222 111",
      clinic: "AUH",
    },
  });

  await db.doctor.upsert({
    where: { id: "dr-aoun" },
    update: {},
    create: { id: "dr-aoun", firstName: "Tarek", lastName: "Aoun", specialty: "Cardiology", licenseNo: "LB-MD-5512", clinic: "Hôtel-Dieu" },
  });

  // ─── TEST CATEGORIES & TESTS ───
  const hematology = await db.testCategory.upsert({
    where: { name: "Hematology" },
    update: {},
    create: { name: "Hematology", nameAr: "علم الدم", sortOrder: 1 },
  });

  const chemistry = await db.testCategory.upsert({
    where: { name: "Clinical Chemistry" },
    update: {},
    create: { name: "Clinical Chemistry", nameAr: "الكيمياء السريرية", sortOrder: 2 },
  });

  const endocrine = await db.testCategory.upsert({
    where: { name: "Endocrinology" },
    update: {},
    create: { name: "Endocrinology", nameAr: "الغدد الصماء", sortOrder: 3 },
  });

  const microbiology = await db.testCategory.upsert({
    where: { name: "Microbiology" },
    update: {},
    create: { name: "Microbiology", nameAr: "علم الأحياء الدقيقة", sortOrder: 4 },
  });

  // CBC
  const cbc = await db.test.upsert({
    where: { code: "CBC" },
    update: {},
    create: {
      code: "CBC",
      name: "Complete Blood Count",
      nameAr: "تعداد الدم الكامل",
      categoryId: hematology.id,
      specimenType: "BLOOD",
      containerType: "EDTA",
      price: 25,
      turnaroundHours: 4,
      method: "Automated Cell Counter",
      parameters: {
        create: [
          { code: "WBC", name: "White Blood Cells", unit: "10^3/μL", refRangeLow: 4.0, refRangeHigh: 11.0, sortOrder: 1 },
          { code: "RBC", name: "Red Blood Cells", unit: "10^6/μL", refRangeLow: 4.5, refRangeHigh: 5.9, sortOrder: 2 },
          { code: "HGB", name: "Hemoglobin", unit: "g/dL", refRangeLow: 13.5, refRangeHigh: 17.5, sortOrder: 3 },
          { code: "HCT", name: "Hematocrit", unit: "%", refRangeLow: 41, refRangeHigh: 53, sortOrder: 4 },
          { code: "PLT", name: "Platelets", unit: "10^3/μL", refRangeLow: 150, refRangeHigh: 400, sortOrder: 5 },
          { code: "MCV", name: "Mean Corpuscular Volume", unit: "fL", refRangeLow: 80, refRangeHigh: 100, sortOrder: 6 },
        ],
      },
    },
  });

  // BMP
  const bmp = await db.test.upsert({
    where: { code: "BMP" },
    update: {},
    create: {
      code: "BMP",
      name: "Basic Metabolic Panel",
      nameAr: "اللوحة الأيضية الأساسية",
      categoryId: chemistry.id,
      specimenType: "BLOOD",
      containerType: "SST",
      price: 35,
      turnaroundHours: 6,
      parameters: {
        create: [
          { code: "GLU", name: "Glucose", unit: "mg/dL", refRangeLow: 70, refRangeHigh: 100, sortOrder: 1 },
          { code: "BUN", name: "Blood Urea Nitrogen", unit: "mg/dL", refRangeLow: 7, refRangeHigh: 20, sortOrder: 2 },
          { code: "CREAT", name: "Creatinine", unit: "mg/dL", refRangeLow: 0.6, refRangeHigh: 1.3, sortOrder: 3 },
          { code: "NA", name: "Sodium", unit: "mmol/L", refRangeLow: 135, refRangeHigh: 145, sortOrder: 4 },
          { code: "K", name: "Potassium", unit: "mmol/L", refRangeLow: 3.5, refRangeHigh: 5.1, sortOrder: 5 },
          { code: "CL", name: "Chloride", unit: "mmol/L", refRangeLow: 98, refRangeHigh: 107, sortOrder: 6 },
        ],
      },
    },
  });

  // Lipid
  const lipid = await db.test.upsert({
    where: { code: "LIPID" },
    update: {},
    create: {
      code: "LIPID",
      name: "Lipid Panel",
      nameAr: "لوحة الدهون",
      categoryId: chemistry.id,
      specimenType: "BLOOD",
      containerType: "SST",
      price: 40,
      turnaroundHours: 8,
      parameters: {
        create: [
          { code: "CHOL", name: "Total Cholesterol", unit: "mg/dL", refRangeLow: 0, refRangeHigh: 200, sortOrder: 1 },
          { code: "HDL", name: "HDL Cholesterol", unit: "mg/dL", refRangeLow: 40, refRangeHigh: 100, sortOrder: 2 },
          { code: "LDL", name: "LDL Cholesterol", unit: "mg/dL", refRangeLow: 0, refRangeHigh: 130, sortOrder: 3 },
          { code: "TRIG", name: "Triglycerides", unit: "mg/dL", refRangeLow: 0, refRangeHigh: 150, sortOrder: 4 },
        ],
      },
    },
  });

  // TSH
  await db.test.upsert({
    where: { code: "TSH" },
    update: {},
    create: {
      code: "TSH",
      name: "Thyroid Stimulating Hormone",
      nameAr: "هرمون تحفيز الغدة الدرقية",
      categoryId: endocrine.id,
      specimenType: "BLOOD",
      containerType: "SST",
      price: 30,
      turnaroundHours: 24,
      parameters: { create: [{ code: "TSH", name: "TSH", unit: "mIU/L", refRangeLow: 0.4, refRangeHigh: 4.0 }] },
    },
  });

  // HbA1c
  await db.test.upsert({
    where: { code: "HBA1C" },
    update: {},
    create: {
      code: "HBA1C",
      name: "Hemoglobin A1c",
      nameAr: "الهيموغلوبين السكري",
      categoryId: endocrine.id,
      specimenType: "BLOOD",
      containerType: "EDTA",
      price: 28,
      turnaroundHours: 12,
      parameters: { create: [{ code: "HBA1C", name: "HbA1c", unit: "%", refRangeLow: 4.0, refRangeHigh: 5.6 }] },
    },
  });

  // Urinalysis
  const urinalysis = await db.test.upsert({
    where: { code: "UA" },
    update: {},
    create: {
      code: "UA",
      name: "Urinalysis",
      nameAr: "تحليل البول",
      categoryId: chemistry.id,
      specimenType: "URINE",
      containerType: "Sterile cup",
      price: 18,
      turnaroundHours: 4,
      parameters: {
        create: [
          { code: "COLOR", name: "Color", refRangeText: "Yellow", sortOrder: 1 },
          { code: "PH", name: "pH", refRangeLow: 4.5, refRangeHigh: 8.0, sortOrder: 2 },
          { code: "PROT", name: "Protein", refRangeText: "Negative", sortOrder: 3 },
          { code: "GLU_U", name: "Glucose", refRangeText: "Negative", sortOrder: 4 },
        ],
      },
    },
  });

  // Urine Culture
  await db.test.upsert({
    where: { code: "UCULT" },
    update: {},
    create: {
      code: "UCULT",
      name: "Urine Culture",
      nameAr: "زرع البول",
      categoryId: microbiology.id,
      specimenType: "URINE",
      containerType: "Sterile cup",
      price: 45,
      turnaroundHours: 72,
      parameters: { create: [{ code: "UCULT", name: "Culture Result", refRangeText: "No growth" }] },
    },
  });

  // ─── PATIENTS ───
  const patientsData = [
    { mrn: "MRN0000001", firstName: "Nour", lastName: "El-Amin", dob: "1989-03-15", gender: "FEMALE", phone: "+961 70 111 222", bloodType: "O+", userId: patientUser.id },
    { mrn: "MRN0000002", firstName: "Bassam", lastName: "Hariri", dob: "1965-07-22", gender: "MALE", phone: "+961 70 333 444", bloodType: "A+" },
    { mrn: "MRN0000003", firstName: "Layla", lastName: "Sayegh", dob: "1992-11-08", gender: "FEMALE", phone: "+961 70 555 666", bloodType: "B-" },
    { mrn: "MRN0000004", firstName: "Ziad", lastName: "Maalouf", dob: "1978-05-30", gender: "MALE", phone: "+961 70 777 888", bloodType: "AB+" },
    { mrn: "MRN0000005", firstName: "Rima", lastName: "Najjar", dob: "1995-01-19", gender: "FEMALE", phone: "+961 70 999 000", bloodType: "O-" },
    { mrn: "MRN0000006", firstName: "Hadi", lastName: "Sleiman", dob: "1955-09-12", gender: "MALE", phone: "+961 76 111 222", bloodType: "A-" },
    { mrn: "MRN0000007", firstName: "Mira", lastName: "Chamoun", dob: "2001-04-25", gender: "FEMALE", phone: "+961 76 333 444", bloodType: "B+" },
  ];

  const patients = [];
  for (const p of patientsData) {
    const patient = await db.patient.upsert({
      where: { mrn: p.mrn },
      update: {},
      create: {
        mrn: p.mrn,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: new Date(p.dob),
        gender: p.gender,
        phone: p.phone,
        bloodType: p.bloodType,
        userId: p.userId,
      },
    });
    patients.push(patient);
  }

  // ─── TEST ORDERS + SAMPLES + RESULTS ───
  const allTests = await db.test.findMany({ include: { parameters: true } });
  const cbcTest = allTests.find((t) => t.code === "CBC")!;
  const bmpTest = allTests.find((t) => t.code === "BMP")!;
  const lipidTest = allTests.find((t) => t.code === "LIPID")!;
  const tshTest = allTests.find((t) => t.code === "TSH")!;
  const hba1cTest = allTests.find((t) => t.code === "HBA1C")!;

  let counter = 1;
  function nextOrderNum() { return `ORD-2026-${String(counter++).padStart(5, "0")}`; }
  function nextBarcode(i: number) { return `LB-${Date.now().toString(36).toUpperCase()}-${String(i).padStart(4, "0")}`; }

  // Build several orders across patients with mixed states
  const orderBlueprints = [
    { patient: patients[0], tests: [cbcTest, bmpTest], priority: "ROUTINE", state: "completed", doctor: "dr-mansour" },
    { patient: patients[0], tests: [hba1cTest], priority: "ROUTINE", state: "in_progress", doctor: "dr-mansour" },
    { patient: patients[1], tests: [lipidTest, bmpTest], priority: "URGENT", state: "validated", doctor: "dr-aoun" },
    { patient: patients[2], tests: [cbcTest], priority: "STAT", state: "received", doctor: null },
    { patient: patients[3], tests: [tshTest], priority: "ROUTINE", state: "collected", doctor: "dr-fares" },
    { patient: patients[4], tests: [bmpTest, hba1cTest], priority: "ROUTINE", state: "in_progress", doctor: "dr-fares" },
    { patient: patients[5], tests: [cbcTest, bmpTest, lipidTest], priority: "URGENT", state: "validated", doctor: "dr-mansour" },
    { patient: patients[6], tests: [cbcTest], priority: "ROUTINE", state: "collected", doctor: null },
  ];

  const sampleRefValues: Record<string, number> = {
    WBC: 7.2, RBC: 5.1, HGB: 14.8, HCT: 44, PLT: 245, MCV: 90,
    GLU: 95, BUN: 14, CREAT: 0.9, NA: 140, K: 4.1, CL: 102,
    CHOL: 185, HDL: 55, LDL: 110, TRIG: 130,
    TSH: 2.3, HBA1C: 5.4,
  };

  function jitter(v: number, p = 0.15) { return +(v * (1 + (Math.random() - 0.5) * p)).toFixed(2); }
  function calcFlag(value: number, low: number | null, high: number | null) {
    if (low == null && high == null) return null;
    if (low != null && value < low * 0.5) return "CRITICAL_LOW";
    if (high != null && value > high * 1.5) return "CRITICAL_HIGH";
    if (low != null && value < low) return "LOW";
    if (high != null && value > high) return "HIGH";
    return "NORMAL";
  }

  let bcIdx = 0;
  for (const bp of orderBlueprints) {
    const totalPrice = bp.tests.reduce((s, t) => s + t.price, 0);
    const order = await db.testOrder.create({
      data: {
        orderNumber: nextOrderNum(),
        patientId: bp.patient.id,
        doctorId: bp.doctor,
        priority: bp.priority,
        status:
          bp.state === "completed" ? "COMPLETED" :
          bp.state === "validated" ? "IN_PROGRESS" :
          bp.state === "in_progress" ? "IN_PROGRESS" :
          bp.state === "received" ? "IN_PROGRESS" : "PENDING",
        diagnosis: bp.priority === "STAT" ? "Suspected anemia, urgent workup" : "Routine annual checkup",
        totalPrice,
        items: { create: bp.tests.map((t) => ({ testId: t.id, price: t.price })) },
      },
    });

    // Group tests by specimen type into samples
    const groups = new Map<string, typeof bp.tests>();
    for (const t of bp.tests) {
      if (!groups.has(t.specimenType)) groups.set(t.specimenType, []);
      groups.get(t.specimenType)!.push(t);
    }

    for (const [specimenType, ts] of groups.entries()) {
      const sample = await db.sample.create({
        data: {
          barcode: nextBarcode(bcIdx++),
          orderId: order.id,
          patientId: bp.patient.id,
          specimenType,
          containerType: ts[0].containerType,
          status:
            bp.state === "completed" || bp.state === "validated" || bp.state === "in_progress" ? "IN_PROCESS" :
            bp.state === "received" ? "RECEIVED" : "COLLECTED",
          collectedById: tech.id,
          receivedById: bp.state !== "collected" ? tech.id : null,
          receivedAt: bp.state !== "collected" ? new Date() : null,
        },
      });

      await db.chainOfCustody.create({
        data: { sampleId: sample.id, userId: tech.id, action: "COLLECTED", location: "Phlebotomy Room A" },
      });
      if (bp.state !== "collected") {
        await db.chainOfCustody.create({
          data: { sampleId: sample.id, userId: tech.id, action: "RECEIVED", location: "Lab Reception" },
        });
      }

      // Create results
      for (const t of ts) {
        for (const p of t.parameters) {
          const ref = sampleRefValues[p.code];
          const status =
            bp.state === "completed" || bp.state === "validated" ? "VALIDATED" :
            bp.state === "in_progress" ? "ENTERED" : "PENDING";
          let valueNumeric: number | null = null;
          let flag: string | null = null;
          if (status !== "PENDING" && ref != null) {
            valueNumeric = jitter(ref);
            flag = calcFlag(valueNumeric, p.refRangeLow, p.refRangeHigh);
          }
          await db.result.create({
            data: {
              sampleId: sample.id,
              parameterId: p.id,
              status,
              valueNumeric,
              flag,
              enteredById: status !== "PENDING" ? tech.id : null,
              enteredAt: status !== "PENDING" ? new Date() : null,
              validatedById: status === "VALIDATED" ? pathologist.id : null,
              validatedAt: status === "VALIDATED" ? new Date() : null,
            },
          });
        }
      }
    }
  }

  // ─── INVENTORY ───
  const inventoryItems = [
    { sku: "RG-001", name: "EDTA tubes (purple)", category: "CONSUMABLE", unit: "box", current: 45, min: 20, supplier: "BD Vacutainer" },
    { sku: "RG-002", name: "SST tubes (gold top)", category: "CONSUMABLE", unit: "box", current: 12, min: 20, supplier: "BD Vacutainer" },
    { sku: "RG-003", name: "Sterile urine cups", category: "CONSUMABLE", unit: "box", current: 60, min: 30, supplier: "Medline" },
    { sku: "RG-101", name: "Hematology Analyzer Reagent A", category: "REAGENT", unit: "L", current: 8, min: 5, supplier: "Sysmex" },
    { sku: "RG-102", name: "Lipid Panel Reagent Kit", category: "REAGENT", unit: "kit", current: 3, min: 5, supplier: "Roche" },
    { sku: "RG-103", name: "HbA1c Reagent", category: "REAGENT", unit: "kit", current: 6, min: 3, supplier: "Bio-Rad" },
    { sku: "EQ-001", name: "Centrifuge (benchtop)", category: "EQUIPMENT", unit: "piece", current: 2, min: 1, supplier: "Eppendorf" },
  ];

  for (const i of inventoryItems) {
    await db.inventoryItem.upsert({
      where: { sku: i.sku },
      update: {},
      create: {
        sku: i.sku,
        name: i.name,
        category: i.category,
        unit: i.unit,
        currentStock: i.current,
        minStock: i.min,
        supplier: i.supplier,
        lots: i.category === "REAGENT" ? {
          create: [{
            lotNumber: `LOT-${Math.floor(Math.random() * 90000) + 10000}`,
            quantity: i.current,
            expiryDate: new Date(Date.now() + (Math.random() * 180 + 20) * 24 * 60 * 60 * 1000),
          }],
        } : undefined,
      },
    });
  }

  // ─── AUDIT LOGS (a few sample entries) ───
  await db.auditLog.create({ data: { action: "LOGIN", entityType: "USER", entityId: admin.id, userId: admin.id } });
  await db.auditLog.create({ data: { action: "CREATE", entityType: "PATIENT", entityId: patients[0].id, userId: reception.id, metadata: JSON.stringify({ mrn: patients[0].mrn }) } });

  // Link patient user to patient record (already done above via userId)

  console.log("✅ Seed complete");
  console.log("");
  console.log("Demo accounts:");
  console.log("  admin@lab.com         / admin123    (Admin)");
  console.log("  pathologist@lab.com   / path123     (Pathologist)");
  console.log("  tech@lab.com          / tech123     (Technician)");
  console.log("  reception@lab.com     / recep123    (Receptionist)");
  console.log("  doctor@lab.com        / doctor123   (Referring Doctor)");
  console.log("  patient@lab.com       / patient123  (Patient Portal)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
