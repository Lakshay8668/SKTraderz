const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let token = "";

// 🔐 LOGIN TO SHIPROCKET
async function getToken() {
    const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
            email: "YOUR_EMAIL",
            password: "YOUR_PASSWORD"
        }
    );
    token = res.data.token;
}

// 📦 TRACK ORDER
app.get("/track/:awb", async (req, res) => {
    try {
        const awb = req.params.awb;

        if (!token) await getToken();

        const response = await axios.get(
            `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        res.json(response.data);

    } catch (err) {
        res.json({ error: "Tracking failed" });
    }
});

app.listen(3000, () => console.log("🚀 Server running"));