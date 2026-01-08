require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors({
    origin: process.env.FRONTEND_URL
}));
app.use(express.json());

const PORT = 3000;

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to GoTutor.ai!"
    });
})


module.exports = app;

if(require.main === module) {
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}