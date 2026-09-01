import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { syncUserSchema } from '../schemas/auth.schemas';

export class AuthController {
    constructor(private authService: AuthService) {}

    syncUser = async (req: Request, res: Response): Promise<void> => {
        const { name, date_of_birth } = syncUserSchema.parse(req.body);
        const result = await this.authService.syncUser(
            req.userId,
            req.userEmail,
            name,
            date_of_birth,
        );
        res.status(200).json(result);
    };

    getProfile = async (req: Request, res: Response): Promise<void> => {
        const profile = await this.authService.getProfile(req.userId);
        res.status(200).json(profile);
    };

    checkName = async (req: Request, res: Response): Promise<void> => {
        const result = await this.authService.checkName(req.userId);
        res.status(200).json(result);
    };
}
