import { PrismaClient } from '@prisma/client';

const MASTER_MILLS_DATA = [
  {
    ref_no: 'P-0006/17-18',
    invoice_no: 'INV/2026/P-0006',
    address: 'OLD FATEHPURA, UDAIPUR-313004, Rajasthan',
    place: 'Udaipur',
    state: 'Rajasthan',
    phone_no: '+919461384842',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0006',
  },
  {
    ref_no: 'P-0007/17-18',
    invoice_no: 'INV/2026/P-0007',
    address: 'NO.E-6,RIICO INDUSTRIAL AREA, PO-GEGAL, AJMER-305001, Rajasthan',
    place: 'Ajmer',
    state: 'Rajasthan',
    phone_no: '+919414117946',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0007',
  },
  {
    ref_no: 'P-0008/17-18',
    invoice_no: 'INV/2026/P-0008',
    address: 'PLOT.NO.199/191, BANNUR, MYSORE-571101, Karnataka',
    place: 'Bannur',
    state: 'Karnataka',
    phone_no: '+919448047784',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0008',
  },
  {
    ref_no: 'P-0009/17-18',
    invoice_no: 'INV/2026/P-0009',
    address: 'M/S.AFRAS CASHEW TRADERS ERAPPANCHAL,MANGADU.P.O, KOLLAM-691010, Kerala',
    place: 'Kollam',
    state: 'Kerala',
    phone_no: '+919995469508',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0009',
  },
  {
    ref_no: 'P-0010/17-18',
    invoice_no: 'INV/2026/P-0010',
    address: 'ROKAMAL MARKET, TIWARIGALI,RAWATPARA, AGRA-282003, Uttarpradesh',
    place: 'Agra',
    state: 'Uttarpradesh',
    phone_no: '+919319113555',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0010',
  },
  {
    ref_no: 'S-0011/17-18',
    invoice_no: 'INV/2026/S-0011',
    address: 'SURVEY NO.1025.LEBURU BIT/2, ADEMMA SATRAM, INDUKURUPET, DIST NELLORE, Andhrapradesh',
    place: 'Nellore',
    state: 'Andhrapradesh',
    phone_no: '+919440278337',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0011',
  },
  {
    ref_no: 'P-0012/17-18',
    invoice_no: 'INV/2026/P-0012',
    address: 'VILLAGE TALUK KEMRI, KEMRI TEHSIL, BILASPUR-244928, DIST RAMPUR, Uttarpradesh',
    place: 'Bilaspur',
    state: 'Uttarpradesh',
    phone_no: '+919760022577',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0012',
  },
  {
    ref_no: 'P-0013/17-18',
    invoice_no: 'INV/2026/P-0013',
    address: '224/225, SHP ROAD,KODAGAHALLI, BANNUR-571101,T.NARASIPURA-TK, Karnataka',
    place: 'Bannur',
    state: 'Karnataka',
    phone_no: '+919448220600',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0013',
  },
  {
    ref_no: 'S-0003/17-18',
    invoice_no: 'INV/2026/S-0003',
    address: 'SAMAYAPURAM ROAD, MANACHANALLUR, TRICHY-621005, Tamilnadu',
    place: 'Manachanallur',
    state: 'Tamilnadu',
    phone_no: '+919443781065',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0003',
  },
  {
    ref_no: 'P-0014/17-18',
    invoice_no: 'INV/2026/P-0014',
    address: '625/1,PILLAIYAR NAGAR, SOWKADU,MOOLAPILLAIYAR KOVIL, SALEM-636005, Tamilnadu',
    place: 'Salem',
    state: 'Tamilnadu',
    phone_no: '+919976161383',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0014',
  },
  {
    ref_no: 'P-0015/17-18',
    invoice_no: 'INV/2026/P-0015',
    address: '28/4, MAIN ROAD, NEDIYAM VILL, PALLIPAT-TK-631207, Tamilnadu',
    place: 'Thiruvallur',
    state: 'Tamilnadu',
    phone_no: '+919491380844',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0015',
  },
  {
    ref_no: 'S-0004/17-18',
    invoice_no: 'INV/2026/S-0004',
    address: 'PLOT.NO.118,KIADB 2ND STAGE, MUNDARGI INDUSTRIAL AREA, BANGALORE ROAD, BELLARY, Karnataka',
    place: 'Bellary',
    state: 'Karnataka',
    phone_no: '+919844414949',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0004',
  },
  {
    ref_no: 'P-0017/17-18',
    invoice_no: 'INV/2026/P-0017',
    address: 'INDUSTRIAL AREA, JODHPUR-342007, Rajasthan',
    place: 'Jodhpur',
    state: 'Rajasthan',
    phone_no: '+919829022980',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0017',
  },
  {
    ref_no: 'P-0018/17-18',
    invoice_no: 'INV/2026/P-0018',
    address: 'DOOR NO.303A,WARD NO.21, ARALIGANUR CROSS,ADONI ROAD, SIRUGUPPA-583121, BELLARY, Karnataka',
    place: 'Bellary',
    state: 'Karnataka',
    phone_no: '+919448862468',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0018',
  },
  {
    ref_no: 'S-0002/17-18',
    invoice_no: 'INV/2026/S-0002',
    address: 'DELIVERY AT : OLD NO.12, NEW NO.17, KAILASAM MUDALI STREET, TONDIARPET, CHENNAI-600081, Tamilnadu',
    place: 'Tondiarpet',
    state: 'Tamilnadu',
    phone_no: '+919443703273',
    mc_model: 'Mark Sorter MS-6',
    frame_no: 'FRM-0002',
  },
];

export async function seedMasterMills(prisma: PrismaClient) {
  console.log('🌱 Seeding Master Mills...');

  for (const item of MASTER_MILLS_DATA) {
    // 1. Find corresponding Mill in DB by ref_no
    const mill = await prisma.mill.findFirst({
      where: { ref_no: item.ref_no, deleted_at: null },
    });

    if (!mill) {
      console.log(`⚠️ Mill not found for ref_no: ${item.ref_no}. Skipping...`);
      continue;
    }

    // 2. Create or update MasterMill
    const existing = await prisma.masterMill.findFirst({
      where: { mill_id: mill.id, deleted_at: null },
    });

    if (existing) {
      await prisma.masterMill.update({
        where: { id: existing.id },
        data: {
          invoice_no: item.invoice_no,
          address: item.address,
          place: item.place,
          state: item.state,
          phone_no: item.phone_no,
          mc_model: item.mc_model,
          frame_no: item.frame_no,
        },
      });
      console.log(`Updated MasterMill for mill: ${mill.name}`);
    } else {
      await prisma.masterMill.create({
        data: {
          invoice_no: item.invoice_no,
          invoice_date: new Date('2026-06-13'),
          ref_no: item.ref_no,
          mill_id: mill.id,
          address: item.address,
          place: item.place,
          state: item.state,
          phone_no: item.phone_no,
          mc_model: item.mc_model,
          frame_no: item.frame_no,
          warranty_years: 1,
          warranty_months: 0,
          installation_date: new Date('2026-06-13'),
          warranty_closing_date: new Date('2027-06-13'),
          all_warranty: 'Under Warranty',
          status: 'ACTIVE',
          type: 'Installation',
        },
      });
      console.log(`Created MasterMill for mill: ${mill.name}`);
    }
  }

  console.log('✅ Master Mills seeding completed!');
}
