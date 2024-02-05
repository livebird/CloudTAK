import Err from '@openaddresses/batch-error';
import Auth from '../lib/auth.js';
import { Response } from 'express';
import { AuthRequest } from '@tak-ps/blueprint-login';
import Config from '../lib/config.js';

export default async function router(schema: any, config: Config) {
    await schema.get('/profile/overlay', {
        name: 'Get Overlays',
        auth: 'user',
        group: 'ProfileOverlays',
        description: 'Get User\'s Profile Overlays',
        res: 'res.ListProfileOverlays.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req);

            const overlays = await config.models.ProfileOverlay.list({
                limit: Number(req.query.limit)
            });

            return res.json(overlays);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.post('/profile/overlay', {
        name: 'Create Overlay',
        auth: 'user',
        group: 'ProfileOverlay',
        description: 'Create Profile Overlay',
        body: 'req.body.CreateProfileOverlay.json',
        res: 'profile_overlays.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            const user = await Auth.is_user(config.models, req);

            const overlay = await config.models.ProfileOverlay.generate({
                ...req.body,
                username: user.email
            });

            return res.json(overlay);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.delete('/profile/overlay', {
        name: 'delete Overlay',
        auth: 'user',
        group: 'ProfileOverlay',
        description: 'Create Profile Overlay',
        query: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string' }
            }
        },
        res: 'res.Standard.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            const user = await Auth.is_user(config.models, req);

            const overlay = await config.models.ProfileOverlay.from(parseInt(String(req.query.id)));

            if (overlay.username !== user.email) {
                throw new Err(403, null, 'Cannot delete anothers overlays');
            }

            await config.models.ProfileOverlay.delete(overlay.id);

            return res.json({
                status: 200,
                message: 'Overlay Removed'
            });
        } catch (err) {
            return Err.respond(err, res);
        }
    });
}
