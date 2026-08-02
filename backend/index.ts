/**
 * GoTutor.ai Backend — Entry Point
 *
 * This is where the entire app gets assembled. The "assembly line" runs
 * bottom-up through the layers:
 *
 *   1. Create Repositories  (they know about Supabase)
 *   2. Create Services       (they know about Repositories)
 *   3. Create Controllers    (they know about Services)
 *   4. Create Routes         (they wire URLs → Controllers)
 *   5. Mount everything on the Express app
 *
 * This is called "Dependency Injection" — each layer receives what it
 * needs through its constructor, rather than importing it directly.
 * This makes everything testable and swappable.
 */
import express, { type Request, type Response } from "express";
import cors from "cors";
import { supabase } from './db';

// Middleware
import { requireAuth } from './middleware/auth.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';

// Repositories (Layer 3 — talks to database)
import { UserRepository } from './repositories/user.repository';
import { ClassRepository } from './repositories/class.repository';
import { MembershipRepository } from './repositories/membership.repository';
import { ConversationRepository } from './repositories/conversation.repository';
import { MessageRepository } from './repositories/message.repository';

// Services (Layer 2 — business logic)
import { AuthService } from './services/auth.service';
import { ClassService } from './services/class.service';
import { ConversationService } from './services/conversation.service';

// Controllers (Layer 1 — HTTP handling)
import { AuthController } from './controllers/auth.controller';
import { ClassController } from './controllers/class.controller';
import { ConversationController } from './controllers/conversation.controller';

// Route factories
import { createAuthRoutes } from './routes/auth.routes';
import { createClassRoutes } from './routes/class.routes';
import { createConversationRoutes } from './routes/conversation.routes';

// ─── 1. CREATE REPOSITORIES ────────────────────────────────────────────
// Each repository receives the Supabase client so it can query tables.

const userRepo = new UserRepository(supabase);
const classRepo = new ClassRepository(supabase);
const membershipRepo = new MembershipRepository(supabase);
const conversationRepo = new ConversationRepository(supabase);
const messageRepo = new MessageRepository(supabase);

// ─── 2. CREATE SERVICES ────────────────────────────────────────────────
// Each service receives the repositories it needs.

const authService = new AuthService(userRepo, supabase);
const classService = new ClassService(classRepo, membershipRepo, userRepo, conversationRepo, messageRepo);
const conversationService = new ConversationService(conversationRepo, membershipRepo);

// ─── 3. CREATE CONTROLLERS ─────────────────────────────────────────────
// Each controller receives the service it delegates to.

const authController = new AuthController(authService);
const classController = new ClassController(classService);
const conversationController = new ConversationController(conversationService);

// ─── 4. CREATE THE EXPRESS APP ──────────────────────────────────────────

export const app = express();
app.use(cors({
    origin: process.env.VITE_FRONTEND_URL,
}));

app.use(express.json());

// ─── 5. MOUNT ROUTES ───────────────────────────────────────────────────
// The route factories create Router instances wired to controller methods.

app.use('/auth', createAuthRoutes(authController, requireAuth));
app.use('/classes', createClassRoutes(classController, requireAuth));
app.use('/conversations', createConversationRoutes(conversationController, requireAuth));

// Health check (no auth required)
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to GoTutor.ai!",
  });
});

// ─── 6. GLOBAL ERROR HANDLER ───────────────────────────────────────────
// MUST be the last app.use() — catches all errors from the layers above.

app.use(errorHandler);

// ─── 7. START SERVER ───────────────────────────────────────────────────

export const PORT = 3000;

export default app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}
