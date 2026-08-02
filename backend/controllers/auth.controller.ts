/**
 * Auth Controller — HTTP handling for /auth endpoints.
 *
 * Each method does exactly 3 things:
 * 1. Parse/validate the request body with Zod
 * 2. Call the appropriate Service method
 * 3. Send the HTTP response
 *
 * No business logic. No database queries. Just HTTP in, HTTP out.
 *
 * Note: Methods are arrow functions (= async ...) so that `this` is
 * preserved when Express calls them as route handler callbacks.
 *
 * Note: No try/catch needed! Express 5 automatically catches errors
 * from async handlers and passes them to the global error handler.
 */
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { syncUserSchema } from '../schemas/auth.schemas';

export class AuthController {
    constructor(private authService: AuthService) {}

    /** POST /auth/sync-user */
    syncUser = async (req: Request, res: Response): Promise<void> => {
        // Zod validates the body — throws ZodError if invalid (→ 400 via error handler)
        const { name, date_of_birth } = syncUserSchema.parse(req.body);

        // req.userId and req.userEmail were set by the requireAuth middleware
        const result = await this.authService.syncUser(
            req.userId,
            req.userEmail,
            name,
            date_of_birth,
        );

        res.status(200).json(result);
    };

    /** GET /auth/me */
    getProfile = async (req: Request, res: Response): Promise<void> => {
        const profile = await this.authService.getProfile(req.userId);
        res.status(200).json(profile);
    };
}
