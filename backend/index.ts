import express, { type Request, type Response } from "express";
import cors from "cors";
import { supabase } from './db';

import { requireAuth } from './middleware/auth.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';

import { UserRepository } from './repositories/user.repository';
import { ClassRepository } from './repositories/class.repository';
import { MembershipRepository } from './repositories/membership.repository';
import { ConversationRepository } from './repositories/conversation.repository';
import { MessageRepository } from './repositories/message.repository';

import { AuthService } from './services/auth.service';
import { ClassService } from './services/class.service';
import { ConversationService } from './services/conversation.service';

import { AuthController } from './controllers/auth.controller';
import { ClassController } from './controllers/class.controller';
import { ConversationController } from './controllers/conversation.controller';

import { createAuthRoutes } from './routes/auth.routes';
import { createClassRoutes } from './routes/class.routes';
import { createConversationRoutes } from './routes/conversation.routes';

// Repositories
const userRepo = new UserRepository(supabase);
const classRepo = new ClassRepository(supabase);
const membershipRepo = new MembershipRepository(supabase);
const conversationRepo = new ConversationRepository(supabase);
const messageRepo = new MessageRepository(supabase);

// Services
const authService = new AuthService(userRepo, supabase);
const classService = new ClassService(classRepo, membershipRepo, userRepo, conversationRepo, messageRepo);
const conversationService = new ConversationService(conversationRepo, membershipRepo);

// Controllers
const authController = new AuthController(authService);
const classController = new ClassController(classService);
const conversationController = new ConversationController(conversationService);

// Express App
export const app = express();
app.use(cors({
    origin: process.env.VITE_FRONTEND_URL,
}));
app.use(express.json());

// Routes
app.use('/auth', createAuthRoutes(authController, requireAuth));
app.use('/classes', createClassRoutes(classController, requireAuth));
app.use('/conversations', createConversationRoutes(conversationController, requireAuth));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to GoTutor.ai!",
  });
});

app.use(errorHandler);

export const PORT = 3000;
export default app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}
