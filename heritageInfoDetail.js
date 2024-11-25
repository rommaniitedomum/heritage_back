import axios from "axios";
import { parseStringPromise } from "xml2js"; // Import xml2js for XML parsing

const CURRENT_HERITAGE_INFO_URL =
  "https://www.cha.go.kr/cha/SearchKindOpenapiList.do";
const CURRENT_HERITAGE_INFO_DETAIL_URL =
  "https://www.cha.go.kr/cha/SearchKindOpenapiDt.do";

// Helper function to build the heritage detail URL
const heritageInfo_Url = (ccbaKdcd, ccbaAsno, ccbaCtcd) => {
  return `${CURRENT_HERITAGE_INFO_DETAIL_URL}?ccbaKdcd=${ccbaKdcd}&ccbaAsno=${ccbaAsno}&ccbaCtcd=${ccbaCtcd}`;
};

// Function to fetch heritage data and metadata
const callCurrentHeritageListByXML = async () => {
  const list = [];

  for (let j = 1; j < 5; j++) {
    try {
      const urlBuilder = `${CURRENT_HERITAGE_INFO_URL}?pageUnit=100&pageIndex=${j}`;
      console.log(`Fetching page ${j}: ${urlBuilder}`);

      // Fetch the list of heritage items
      const response = await axios.get(urlBuilder, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/xml",
        },
      });

      if (response.status !== 200) {
        console.error(`Error fetching page ${j}: ${response.statusText}`);
        continue; // Skip to the next page
      }

      const xmlText = response.data;

      // Parse XML response into JSON
      const jsonData = await parseStringPromise(xmlText);
      const items = jsonData.result?.item || []; // Safely extract items array

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
        };

        console.log(`Fetching detail for: ${heritage.sn}`);

        // Fetch detailed heritage data
        const detailResponse = await axios.get(
          heritageInfo_Url(
            heritage.ccbaKdcd,
            heritage.ccbaAsno,
            heritage.ccbaCtcd
          ),
          {
            headers: { Accept: "application/xml" },
          }
        );

        if (detailResponse.status !== 200) {
          console.error(
            `Error fetching details for sn: ${heritage.sn}, status: ${detailResponse.statusText}`
          );
          continue;
        }

        const detailXmlText = detailResponse.data;

        // Parse detailed XML response into JSON
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

export default callCurrentHeritageListByXML;
