import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding branches and reference ranges…");

  // ─── BRANCHES ───
  const branches = [
    {
      code: "BRT-CTR",
      name: "Beirut Central",
      nameAr: "بيروت المركزي",
      address: "Hamra Street, Building 42, Beirut",
      city: "Beirut",
      phone: "+961 1 234 567",
      email: "central@klevlab.com",
      managerName: "Dr. Hala Khoury",
      managerPhone: "+961 3 111 222",
      isMain: true,
      isActive: true,
      homeCollection: true,
      collectionZone: "Hamra, Verdun, Manara, Achrafieh",
      services: "PHLEBOTOMY,IMAGING,PCR,COVID,HOME_COLLECTION,VACCINATION",
      hours: JSON.stringify({
        mon: { open: "07:00", close: "20:00", closed: false },
        tue: { open: "07:00", close: "20:00", closed: false },
        wed: { open: "07:00", close: "20:00", closed: false },
        thu: { open: "07:00", close: "20:00", closed: false },
        fri: { open: "07:00", close: "20:00", closed: false },
        sat: { open: "08:00", close: "16:00", closed: false },
        sun: { open: "09:00", close: "13:00", closed: false },
      }),
    },
    {
      code: "JOU-BR",
      name: "Jounieh Branch",
      nameAr: "فرع جونية",
      address: "Maameltein Highway, Jounieh",
      city: "Jounieh",
      phone: "+961 9 555 333",
      email: "jounieh@klevlab.com",
      managerName: "Omar Haddad",
      managerPhone: "+961 3 444 555",
      isActive: true,
      homeCollection: true,
      collectionZone: "Jounieh, Kaslik, Adma, Zouk",
      services: "PHLEBOTOMY,PCR,COVID,HOME_COLLECTION",
      hours: JSON.stringify({
        mon: { open: "08:00", close: "18:00", closed: false },
        tue: { open: "08:00", close: "18:00", closed: false },
        wed: { open: "08:00", close: "18:00", closed: false },
        thu: { open: "08:00", close: "18:00", closed: false },
        fri: { open: "08:00", close: "18:00", closed: false },
        sat: { open: "09:00", close: "14:00", closed: false },
        sun: { open: "00:00", close: "00:00", closed: true },
      }),
    },
    {
      code: "TRP-BR",
      name: "Tripoli Branch",
      nameAr: "فرع طرابلس",
      address: "Azmi Street, Tripoli",
      city: "Tripoli",
      phone: "+961 6 777 888",
      email: "tripoli@klevlab.com",
      managerName: "Lina Saad",
      managerPhone: "+961 3 666 777",
      isActive: true,
      homeCollection: false,
      collectionZone: "—",
      services: "PHLEBOTOMY,PCR,VACCINATION",
      hours: JSON.stringify({
        mon: { open: "08:00", close: "17:00", closed: false },
        tue: { open: "08:00", close: "17:00", closed: false },
        wed: { open: "08:00", close: "17:00", closed: false },
        thu: { open: "08:00", close: "17:00", closed: false },
        fri: { open: "08:00", close: "17:00", closed: false },
        sat: { open: "09:00", close: "13:00", closed: false },
        sun: { open: "00:00", close: "00:00", closed: true },
      }),
    },
    {
      code: "SDA-BR",
      name: "Saida Branch",
      nameAr: "فرع صيدا",
      address: "Riad El Solh Street, Saida",
      city: "Saida",
      phone: "+961 7 222 444",
      email: "saida@klevlab.com",
      managerName: "Karim Mansour",
      managerPhone: "+961 3 222 333",
      isActive: false,
      homeCollection: false,
      collectionZone: "—",
      services: "PHLEBOTOMY",
      hours: JSON.stringify({
        mon: { open: "08:00", close: "16:00", closed: false },
        tue: { open: "08:00", close: "16:00", closed: false },
        wed: { open: "08:00", close: "16:00", closed: false },
        thu: { open: "08:00", close: "16:00", closed: false },
        fri: { open: "08:00", close: "16:00", closed: false },
        sat: { open: "00:00", close: "00:00", closed: true },
        sun: { open: "00:00", close: "00:00", closed: true },
      }),
    },
  ];

  for (const b of branches) {
    await db.branch.upsert({
      where: { code: b.code },
      update: {},
      create: b,
    });
  }

  // ─── REFERENCE RANGES (CBC sample data) ───
  const cbc = await db.test.findUnique({ where: { code: "CBC" }, include: { parameters: true } });
  if (cbc) {
    // Hemoglobin sex/age-specific ranges
    const hgb = cbc.parameters.find((p) => p.code === "HGB");
    if (hgb) {
      const existing = await db.referenceRange.findFirst({ where: { parameterId: hgb.id } });
      if (!existing) {
        await db.referenceRange.createMany({
          data: [
            { parameterId: hgb.id, gender: "MALE", ageMin: 0, ageMax: 17, low: 11.5, high: 15.5 },
            { parameterId: hgb.id, gender: "MALE", ageMin: 18, ageMax: 60, low: 13.5, high: 17.5 },
            { parameterId: hgb.id, gender: "MALE", ageMin: 61, ageMax: 120, low: 12.5, high: 17.0 },
            { parameterId: hgb.id, gender: "FEMALE", ageMin: 0, ageMax: 17, low: 11.0, high: 14.5 },
            { parameterId: hgb.id, gender: "FEMALE", ageMin: 18, ageMax: 60, low: 12.0, high: 16.0 },
            { parameterId: hgb.id, gender: "FEMALE", ageMin: 61, ageMax: 120, low: 11.5, high: 15.5 },
          ],
        });
      }
    }
  }

  console.log("✅ Extra seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
