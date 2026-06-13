import { PrismaClient } from '@prisma/client';

const CUSTOMERS_DATA = [
  {
    ref_no: 'P-0006/17-18',
    name: 'Seva Mandir',
    address: 'OLD FATEHPURA, UDAIPUR-313004',
    place: 'Udaipur',
    city: 'Udaipur',
    state: 'Rajasthan',
    phoneStr: '9461384842'
  },
  {
    ref_no: 'P-0007/17-18',
    name: 'A-1 Kaju India',
    address: 'NO.E-6,RIICO INDUSTRIAL AREA, PO-GEGAL, AJMER-305001',
    place: 'Ajmer',
    city: 'Ajmer',
    state: 'Rajasthan',
    phoneStr: '9414117946'
  },
  {
    ref_no: 'P-0008/17-18',
    name: 'S.S.Agro Mills',
    address: 'PLOT.NO.199/191, BANNUR, MYSORE-571101',
    place: 'Bannur',
    city: 'Mysore',
    state: 'Karnataka',
    phoneStr: '9448047784'
  },
  {
    ref_no: 'P-0009/17-18',
    name: 'Siyavudeen Kabeerkutty (a) Afras Cashew Traders',
    address: 'M/S.AFRAS CASHEW TRADERS ERAPPANCHAL,MANGADU.P.O, KOLLAM-691010',
    place: 'Kollam',
    city: 'Kollam',
    state: 'Kerala',
    phoneStr: '9995469508'
  },
  {
    ref_no: 'P-0010/17-18',
    name: 'G.S.Industries',
    address: 'KOKAMAL MARKET, TIWARIGALI,RAWATPARA, AGRA-282003',
    place: 'Agra',
    city: 'Agra',
    state: 'Uttarpradesh',
    phoneStr: '9319113555'
  },
  {
    ref_no: 'S-0011/17-18',
    name: 'Sri Sai Lakshmi Dall Industries',
    address: 'SURVEY NO.1025.LEBURU BIT/2, ADEMMA SATRAM IND.KURAPUR',
    place: 'Nellore',
    city: 'Nellore',
    state: 'Andhrapradesh',
    phoneStr: '9440278337/ 90000 04417'
  },
  {
    ref_no: 'P-0012/17-18',
    name: 'Kemri Rice Mill',
    address: 'VILLAGE HALKHURAPUR, KEMRI TEHSIL, BILASPUR-244928, DIST RAMPUR',
    place: 'Bilaspur',
    city: 'Rampur',
    state: 'Uttarpradesh',
    phoneStr: '976002257/ 9412647076'
  },
  {
    ref_no: 'P-0013/17-18',
    name: 'Siddiq Rice Industries',
    address: '224/224 SRP ROAD,KODAGAHALLI, BANNUR-571101,T.NARASIPURA-TK',
    place: 'Bannur',
    city: 'Mysore',
    state: 'Karnataka',
    phoneStr: '9448220600'
  },
  {
    ref_no: 'S-0003/17-18',
    name: 'Sri Srinivasa Rice & Oil Mill',
    address: 'SAMAYAPURAM ROAD, MANACHANALLUR, TRICHY-621005',
    place: 'Manachanallur',
    city: 'Trichy',
    state: 'Tamilnadu',
    phoneStr: '9443781065'
  },
  {
    ref_no: 'P-0014/17-18',
    name: 'Shiva Traders',
    address: '625/1,PILLAIYAR NAGAR, SOWKADU,MOOLAPILLAIYAR KOVIL, SALEM-636005',
    place: 'Salem',
    city: 'Salem',
    state: 'Tamilnadu',
    phoneStr: '9976161383'
  },
  {
    ref_no: 'P-0015/17-18',
    name: 'Chandran Dall Mills',
    address: '28/4, MAIN ROAD, NEDIYAM VILL, PALLIPAT-TK-631207',
    place: 'Thiruvallur',
    city: 'Thiruvallur',
    state: 'Tamilnadu',
    phoneStr: '9491380844'
  },
  {
    ref_no: 'S-0004/17-18',
    name: 'Vardhman Industries',
    address: 'PLOT.NO.118,KIADB 2ND STAGE, MUNDARGI INDUSTRIAL AREA, BANGALORE ROAD BELLARY',
    place: 'Bellary',
    city: 'Bellary',
    state: 'Karnataka',
    phoneStr: '9844414949, 9448038081, 9035666665'
  },
  {
    ref_no: 'P-0017/17-18',
    name: 'Hanumant Industries',
    address: 'INDUSTRIAL AREA, JODHPUR-342007',
    place: 'Jodhpur',
    city: 'Jodhpur',
    state: 'Rajasthan',
    phoneStr: '9829022980'
  },
  {
    ref_no: 'P-0018/17-18',
    name: 'Taraka Srirama Agro Foods',
    address: 'DOOR NO.303A,WARD NO.21, ARALIGANUR CROSS,ADONI ROAD, SIRUGUPPA-583121 BELLARY',
    place: 'Bellary',
    city: 'Bellary',
    state: 'Karnataka',
    phoneStr: '9448862468'
  },
  {
    ref_no: 'S-0002/17-18',
    name: 'Senthil Traders',
    address: 'NEW NO.17, KAILASAM MUDALI STREET, TONDIARPET CHENNAI 600081',
    place: 'Tondiarpet',
    city: 'Chennai',
    state: 'Tamilnadu',
    phoneStr: '9443703273'
  },
  {
    ref_no: 'P-0019/17-18',
    name: 'Sri Sai Traders',
    address: 'NO.165,JEEVAN LAL NAGAR, TIRUVOTTIYUR, CHENNAI-600019',
    place: 'Tondiarpet',
    city: 'Chennai',
    state: 'Tamilnadu',
    phoneStr: '9884069123'
  },
  {
    ref_no: 'S-0006/17-18',
    name: 'Al Ameen Modern Rice Mill',
    address: '110/A-5, MITHRAVAYAL ROAD, MELAMANAKKUDI, SAKKOTTAI, PUDUVAYAL, SIVAGANGAI-630108',
    place: 'Puduvayal',
    city: 'Trichy',
    state: 'Tamilnadu',
    phoneStr: '9443382773, 9489785920'
  }
];

function parsePhones(phoneVal: string | null | undefined): string[] {
  if (!phoneVal) return [];
  const parts = phoneVal.split(/[\/,]/);
  return parts.map(p => p.trim().replace(/\s+/g, '')).filter(Boolean).map(p => {
    if (p.startsWith('+')) return p;
    if (p === '976002257') p = '9760022577';
    return `+91${p}`;
  });
}

export async function seedCustomers(prisma: PrismaClient) {
  console.log('🌱 Seeding customers and mills...');

  for (const item of CUSTOMERS_DATA) {
    const phones = parsePhones(item.phoneStr);
    const primaryPhone = phones[0] || null;
    const phone_2 = phones[1] || null;
    const phone_3 = phones[2] || null;
    const address = item.address && item.state ? `${item.address}, ${item.state}` : item.address;

    // 1. Find or create Customer
    let customer = await prisma.customer.findFirst({
      where: { name: item.name, deleted_at: null }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: item.name,
          phone: primaryPhone,
          address: address,
          status: 'ACTIVE'
        }
      });
      console.log(`Created Customer: ${customer.name}`);
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          phone: primaryPhone,
          address: address
        }
      });
      console.log(`Updated Customer: ${customer.name}`);
    }

    // 2. Find or create Mill linked to this Customer
    let mill = await prisma.mill.findFirst({
      where: {
        OR: [
          { ref_no: item.ref_no },
          { name: item.name }
        ],
        deleted_at: null
      }
    });

    if (!mill) {
      mill = await prisma.mill.create({
        data: {
          name: item.name,
          ref_no: item.ref_no,
          phone: primaryPhone,
          phone_2: phone_2,
          phone_3: phone_3,
          address: address,
          place: item.place,
          city: item.city,
          status: 'ACTIVE',
          customer_id: customer.id
        }
      });
      console.log(`Created Mill: ${mill.name} (${mill.ref_no})`);
    } else {
      mill = await prisma.mill.update({
        where: { id: mill.id },
        data: {
          name: item.name,
          ref_no: item.ref_no,
          phone: primaryPhone,
          phone_2: phone_2,
          phone_3: phone_3,
          address: address,
          place: item.place,
          city: item.city,
          customer_id: customer.id
        }
      });
      console.log(`Updated Mill: ${mill.name} (${mill.ref_no})`);
    }
  }

  console.log('✅ Customers and mills seeding completed!');
}
