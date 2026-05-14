import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
}));

app.use(express.json());

const PORT = 3000;

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to GoTutor.ai!",
  });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}
