import axios from 'axios';

async function main() {
  try {
    const url = 'http://localhost:4000/api/v1/master-mills';
    console.log('Sending request to', url);
    const response = await axios.get(url, {
      params: {
        search: 'P-00988',
        status: 'ACTIVE',
        skip: 0,
        take: 10
      }
    });
    console.log('STATUS:', response.status);
    console.log('DATA:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('ERROR MESSAGE:', error.message);
    if (error.response) {
      console.log('ERROR RESPONSE STATUS:', error.response.status);
      console.log('ERROR RESPONSE DATA:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main();
