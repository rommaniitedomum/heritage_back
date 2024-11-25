import pg from "pg";
import fetch from "node-fetch";

// PostgreSQL client configuration
const client = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

const CURRENT_HERITAGE_INFO_URL =
  "http://www.cha.go.kr/cha/SearchKindOpenapiList.do?pageUnit=100&pageIndex=1";

// Connect to the database
client.connect();

const fetchAndInsertData = async () => {
  try {
    const response = await fetch(CURRENT_HERITAGE_INFO_URL, {
      headers: { Accept: "application/xml" },
    });

    if (!response.ok) throw new Error("Failed to fetch API data");

    const xmlText = await response.text();
    // Parse XML (use a library like xml2js for better results)
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const items = doc.getElementsByTagName("item");

    for (let i = 0; i < items.length; i++) {
      const eElement = items[i];
      const data = {
        ccbaKdcd:
          eElement.getElementsByTagName("ccbaKdcd")[0]?.textContent || null,
        ccbaAsno:
          eElement.getElementsByTagName("ccbaAsno")[0]?.textContent || null,
        ccbaCtcd:
          eElement.getElementsByTagName("ccbaCtcd")[0]?.textContent || null,
        ccmaName:
          eElement.getElementsByTagName("ccmaName")[0]?.textContent || null,
        ccbaMnm1:
          eElement.getElementsByTagName("ccbaMnm1")[0]?.textContent || null,
        ccbaMnm2:
          eElement.getElementsByTagName("ccbaMnm2")[0]?.textContent || null,
        longitude:
          eElement.getElementsByTagName("longitude")[0]?.textContent || null,
        latitude:
          eElement.getElementsByTagName("latitude")[0]?.textContent || null,
        content:
          eElement.getElementsByTagName("content")[0]?.textContent || null,
        imageUrl:
          eElement.getElementsByTagName("imageUrl")[0]?.textContent || null,
      };

      // Insert into PostgreSQL
      const query = `
        INSERT INTO heritage_data (ccbaKdcd, ccbaAsno, ccbaCtcd, ccmaName, ccbaMnm1, ccbaMnm2, longitude, latitude, content, imageUrl)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      await client.query(query, [
        data.ccbaKdcd,
        data.ccbaAsno,
        data.ccbaCtcd,
        data.ccmaName,
        data.ccbaMnm1,
        data.ccbaMnm2,
        data.longitude,
        data.latitude,
        data.content,
        data.imageUrl,
      ]);
    }

    console.log("Data inserted successfully!");
  } catch (error) {
    console.error("Error fetching or inserting data:", error);
  } finally {
    client.end();
  }
};

fetchAndInsertData();
