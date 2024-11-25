import express from "express";
import axios from "axios";
import { parseStringPromise } from "xml2js"; // Import xml2js

const app = express();

const CURRENT_HERITAGE_INFO_URL =
  "https://www.cha.go.kr/cha/SearchKindOpenapiList.do";
const CURRENT_HERITAGE_INFO_DETAIL_URL =
  "https://www.cha.go.kr/cha/SearchKindOpenapiDt.do";

// Build detail URL
const heritageInfo_Url = (ccbaKdcd, ccbaAsno, ccbaCtcd) => {
  return `${CURRENT_HERITAGE_INFO_DETAIL_URL}?ccbaKdcd=${ccbaKdcd}&ccbaAsno=${ccbaAsno}&ccbaCtcd=${ccbaCtcd}`;
};

// Fetch Heritage Data with Axios and parse using xml2js
const callCurrentHeritageListByXML = async () => {
  const list = [];

  for (let j = 1; j < 167; j++) {
    try {
      const url = `${CURRENT_HERITAGE_INFO_URL}?pageUnit=100&pageIndex=${j}`;
      console.log(`Fetching page ${j}: ${url}`);

      // Fetch data with Axios
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/xml",
        },
      });

      const xmlText = response.data; // Axios automatically decodes response

      // Parse XML to JSON
      const jsonData = await parseStringPromise(xmlText);
      const items = jsonData.result?.item || []; // Extract items safely

      console.log(`Found ${items.length} items on page ${j}`);
      for (const item of items) {
        const heritage = {
          sn: item.sn?.[0] || "-",
          no: item.no?.[0] || "-",
          ccmaName: item.ccmaName?.[0] || "-",
          crltsnoNm: item.crltsnoNm?.[0] || "-",
          ccbaMnm1: item.ccbaMnm1?.[0] || "-",
          ccbaMnm2: item.ccbaMnm2?.[0] || "-",
          ccbaCtcdNm: item.ccbaCtcdNm?.[0] || "-",
          ccsiName: item.ccsiName?.[0] || "-",
          ccbaAdmin: item.ccbaAdmin?.[0] || "-",
          longitude: item.longitude?.[0] || "-",
          latitude: item.latitude?.[0] || "-",
          ccbaKdcd: item.ccbaKdcd?.[0] || "-",
          ccbaAsno: item.ccbaAsno?.[0] || "-",
          ccbaCtcd: item.ccbaCtcd?.[0] || "-",
        };

        console.log("Fetching detail for:", heritage.sn);
        const detailResponse = await axios.get(
          heritageInfo_Url(
            heritage.ccbaKdcd,
            heritage.ccbaAsno,
            heritage.ccbaCtcd
          ),
          { headers: { Accept: "application/xml" } }
        );

        const detailXmlText = detailResponse.data;
        const detailJsonData = await parseStringPromise(detailXmlText);
        const detailItem = detailJsonData.result?.item?.[0] || {};

        heritage.gcodeName = detailItem.gcodeName?.[0] || "-";
        heritage.bcodeName = detailItem.bcodeName?.[0] || "-";
        heritage.imageUrl = detailItem.imageUrl?.[0] || "-";
        heritage.content = detailItem.content?.[0] || "-";

        list.push(heritage);
      }
    } catch (error) {
      console.error(`Error on page ${j}:`, error.message);
    }
  }

  return list;
};

// Root Endpoint
app.get("/", (req, res) => {
  res.send("Welcome to the Heritage Info API! Use /heritage-info to get data.");
});

// Heritage Info Endpoint
app.get("/heritage-info", async (req, res) => {
  try {
    const data = await callCurrentHeritageListByXML();
    res.json(data);
  } catch (error) {
    console.error("Error fetching heritage information:", error.message);
    res.status(500).send({ error: "Failed to fetch heritage information" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
