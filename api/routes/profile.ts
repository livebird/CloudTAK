import Err from '@openaddresses/batch-error';
import Profile from '../lib/types/profile.js';
import Auth from '../lib/auth.js';

import { Response } from 'express';
import { AuthRequest } from '@tak-ps/blueprint-login';
import Config from '../lib/config.js';

export default async function router(schema: any, config: Config) {
    await schema.get('/profile', {
        name: 'Get Profile',
        auth: 'user',
        group: 'Profile',
        description: 'Get User\'s Profile',
        res: 'res.Profile.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(req);

            const profile = await Profile.from(config.pool, req.auth.email, {
                column: 'username'
            });

            return res.json(profile);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.patch('/profile', {
        name: 'Update Profile',
        auth: 'user',
        group: 'Profile',
        description: 'Update User\'s Profile',
        body: 'req.body.PatchProfile.json',
        res: 'res.Profile.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(req);

            const profile = await Profile.from(config.pool, req.auth.email, {
                column: 'username'
            });

            await profile.commit(req.body);

            return res.json(profile);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

}
