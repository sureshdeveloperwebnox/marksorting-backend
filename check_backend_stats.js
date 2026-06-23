const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const statsRes = await get('http://localhost:4000/api/v1/master-mills/stats');
    console.log("Stats Response status:", statsRes.statusCode);
    console.log("Stats Response body:", statsRes.body);

    const listRes = await get('http://localhost:4000/api/v1/master-mills?take=100');
    console.log("List Response status:", listRes.statusCode);
    if (listRes.body && listRes.body.masterMills) {
      console.log("List Response total:", listRes.body.total);
      console.log("List Response length:", listRes.body.masterMills.length);
      const wGroups = {};
      listRes.body.masterMills.forEach(m => {
        wGroups[m.all_warranty] = (wGroups[m.all_warranty] || 0) + 1;
      });
      console.log("Returned records grouped by warranty status:", wGroups);
    } else {
      console.log("List Response body:", listRes.body);
    }
  } catch (error) {
    console.error("Error connecting to backend:", error.message);
  }
}

main();
