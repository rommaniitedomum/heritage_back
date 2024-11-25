import axios from "axios";
import { parseStringPromise } from "xml2js"; // Import xml2js for XML parsing

const CURRENT_HERITAGE_INFO_URL =
  "https://www.cha.go.kr/cha/SearchKindOpenapiList.do";
const CURRENT_HERITAGE_IMAGE =
  "https://www.cha.go.kr/cha/SearchImageOpenapi.do";

// Helper function to build the heritage image URL
const heritageImage_Url = (ccbaKdcd, ccbaAsno, ccbaCtcd) => {
  return `${CURRENT_HERITAGE_IMAGE}?ccbaKdcd=${ccbaKdcd}&ccbaAsno=${ccbaAsno}&ccbaCtcd=${ccbaCtcd}`;
};

// Function to fetch heritage images and metadata
const callCurrentHeritageImageByXML = async () => {
  const list = [];

  for (let j = 1; j < 167; j++) {
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
        continue;
      }

      const xmlText = response.data;

      // Parse XML response into JSON
      const jsonData = await parseStringPromise(xmlText);
      const items = jsonData.result?.item || []; // Safely extract items array

      console.log(`Found ${items.length} items on page ${j}`);

      for (const item of items) {
        const no = item.no?.[0] || "-";
        const ccbaKdcd = item.ccbaKdcd?.[0] || "-";
        const ccbaCtcd = item.ccbaCtcd?.[0] || "-";
        const ccbaAsno = item.ccbaAsno?.[0] || "-";

        console.log(`Fetching image data for no: ${no}`);

        // Fetch detailed heritage image data
        const detailResponse = await axios.get(
          heritageImage_Url(ccbaKdcd, ccbaAsno, ccbaCtcd),
          {
            headers: { Accept: "application/xml" },
          }
        );

        if (detailResponse.status !== 200) {
          console.error(
            `Error fetching details for no: ${no}, status: ${detailResponse.statusText}`
          );
          continue;
        }

        const detailXmlText = detailResponse.data;

        // Parse detailed XML response into JSON
        const detailJsonData = await parseStringPromise(detailXmlText);
        const snList = detailJsonData.result?.sn || [];
        const imageUrlList = detailJsonData.result?.imageUrl || [];
        const ccimDescList = detailJsonData.result?.ccimDesc || [];

        // Map each image with its metadata
        for (let k = 0; k < snList.length; k++) {
          const heritageImage = {
            sn: k + 1,
            imageUrl: imageUrlList[k] || "",
            ccimDesc: ccimDescList[k] || "",
            no,
            ccbaKdcd,
            ccbaCtcd,
            ccbaAsno,
          };

          list.push(heritageImage);
        }
      }
    } catch (error) {
      console.error(`Error on page ${j}:`, error.message);
    }
  }

  return list;
};

export default callCurrentHeritageImageByXML;
