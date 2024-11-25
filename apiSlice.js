const express = import("express");
const app = express();

app.get("/heritage-info", async (req, res) => {
  try {
    console.log("Fetching heritage information...");
    const data = await callCurrentHeritageListByXML();
    console.log(`Fetched ${data.length} items.`);
    res.json(data);
  } catch (error) {
    console.error("Error in /heritage-info:", error.message, error.stack);
    res.status(500).send({ error: "Failed to fetch heritage information" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
