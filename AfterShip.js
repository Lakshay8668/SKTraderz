const fetch = require("node-fetch");

app.get("/track/:id", async (req, res) => {
    const trackingId = req.params.id;

    const response = await fetch(
        `https://api.aftership.com/v4/trackings/dhl/${trackingId}`,
        {
            headers: {
                "aftership-api-key": "YOUR_API_KEY"
            }
        }
    );

    const data = await response.json();
    res.json(data);
});