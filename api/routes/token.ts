import { Response } from 'express';
import { AuthRequest } from '@tak-ps/blueprint-login';
import Err from '@openaddresses/batch-error';
import Auth from '../lib/auth.js';
//import Token from '../lib/types/token.js';
import { Token } from '../lib/schema.js';
import Config from '../lib/config.js';
import { promisify } from 'util';
import crypto from 'crypto';
import { sql } from 'drizzle-orm';

const randomBytes = promisify(crypto.randomBytes);

export default async function router(schema: any, config: Config) {
    await schema.get('/token', {
        name: 'List Tokens',
        group: 'Token',
        auth: 'user',
        description: 'List all tokens associated with the requester\'s account',
        res: 'res.ListTokens.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(req);

            const pgres = await config.pg.select({
                count: sql<number>`count(*) OVER()`.as('count'),
                Token
            }).from(Token)
                .limit(Number(req.query.limit))

            if (pgres.length === 0) {
                return res.json({ total: 0, items: [] });
            } else {
                return res.json({
                    total: pgres[0].count,
                    items: pgres.map((t) => { return t.Token })
                });
            }
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.post('/token', {
        name: 'Create Tokens',
        group: 'Token',
        auth: 'user',
        description: 'Create a new API token for programatic access',
        body: 'req.body.CreateToken.json',
        res: 'res.CreateToken.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(req);

            if (!req.auth.email) throw new Err(400, null, 'Tokens can only be generated by an JWT authenticated user');

            const token = await config.pg.insert(Token).values({ 
                ...req.body,
                token: 'etl.' + (await randomBytes(32)).toString('hex'),
                email: req.auth.email
            }).returning();

            return res.json(token);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

/*
    await schema.patch('/token/:id', {
        name: 'Update Token',
        group: 'Token',
        auth: 'user',
        ':id': 'integer',
        description: 'Update properties of a Token',
        body: 'req.body.PatchToken.json',
        res: 'res.Standard.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(req);

            if (!req.auth.email) throw new Err(400, null, 'Tokens can only be generated by an JWT authenticated user');

            const token = await Token.from(config.pool, req.params.id, {
                column: 'id'
            });
            if (token.email !== req.auth.email) throw new Err(400, null, 'You can only modify your own tokens');
            await token.commit({
                updated: sql`Now()`,
                ...req.body
            })

            return res.json({ status: 200, message: 'Token Updated' });
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.delete('/token/:id', {
        name: 'Delete Tokens',
        group: 'Token',
        auth: 'user',
        description: 'Delete a user\'s API Token',
        ':id': 'integer',
        res: 'res.Standard.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(req);

            if (!req.auth.email) throw new Err(400, null, 'Tokens can only be deleted by an JWT authenticated user');

            const token = await Token.from(config.pool, req.params.id, {
                column: 'id'
            });

            if (req.auth.email !== token.email) throw new Err(400, null, 'Cannot delete another\'s token');

            return res.json(await token.delete(config.pool, {
                column: 'id'
            }));
        } catch (err) {
            return Err.respond(err, res);
        }
    });
*/
}
