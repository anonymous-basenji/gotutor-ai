import express, { type Request, type Response } from "express";
import cors from "cors";
import authRouter from './routes/auth';
import classesRouter from './routes/classes';
import { supabase } from './db';

export const app = express();
app.use(cors({
    origin: process.env.VITE_FRONTEND_URL,
}));

app.use(express.json());

app.use('/auth', authRouter);
app.use('/classes', classesRouter);

export const PORT = 3000;


app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to GoTutor.ai!",
  });
});

export default app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}
