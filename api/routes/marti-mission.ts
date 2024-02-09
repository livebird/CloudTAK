import Err from '@openaddresses/batch-error';
import Auth from '../lib/auth.js';
import Config from '../lib/config.js';
import bodyparser from 'body-parser';
import { Profile, Connection } from '../lib/schema.js';
import S3 from '../lib/aws/s3.js';
import { Response } from 'express';
import { AuthRequest } from '@tak-ps/blueprint-login';
import TAKAPI, {
    APIAuthToken,
    APIAuthCertificate,
    APIAuthPassword
} from '../lib/tak-api.js';

export default async function router(schema: any, config: Config) {
    await schema.get('/marti/missions/:name', {
        name: 'Get Mission',
        group: 'MartiMissions',
        auth: 'user',
        ':name': 'string',
        description: 'Helper API to get a single mission',
        query: {
            type: 'object',
            properties: {
                password: {
                    type: 'boolean',
                    default: false,
                },
                changes: {
                    type: 'boolean',
                    default: false
                },
                logs: { type: 'string' },
                secago: { type: 'string' },
                start: { type: 'string' },
                end: { type: 'string' }
            }
        },
        res: 'res.Marti.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req);

            const user = await Auth.as_user(config.models, req);
            const auth = (await config.models.Profile.from(user.email)).auth;
            const api = await TAKAPI.init(new URL(String(config.server.api)), new APIAuthCertificate(auth.cert, auth.key));

            const query = {};
            for (const q in req.query) query[q] = String(req.query[q]);
            const mission = await api.Mission.get(req.params.name, query);
            return res.json(mission);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.delete('/marti/missions/:name', {
        name: 'Delete Mission',
        group: 'MartiMissions',
        auth: 'user',
        ':name': 'string',
        description: 'Helper API to delete a single mission',
        query: {
            type: 'object',
            properties: {
                creatorUid: {
                    type: 'string'
                },
                deepDelete: {
                    type: 'boolean'
                }
            }
        },
        res: 'res.Marti.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req);

            const user = await Auth.as_user(config.models, req);
            const auth = (await config.models.Profile.from(user.email)).auth;
            const api = await TAKAPI.init(new URL(String(config.server.api)), new APIAuthCertificate(auth.cert, auth.key));

            const query = {};
            for (const q in req.query) query[q] = String(req.query[q]);
            const mission = await api.Mission.delete(req.params.name, query);
            return res.json(mission);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.post('/marti/missions/:name', {
        name: 'Create Mission',
        group: 'MartiMissions',
        auth: 'user',
        ':name': 'string',
        description: 'Helper API to create a mission',
        query: {
            type: 'object',
            additionalProperties: false,
            properties: {
                creatorUid: { type: 'string' },
                group: { type: 'array', items: { type: 'string' } },
                description: { type: 'string' },
                chatRoom: { type: 'string' },
                baseLayer: { type: 'string' },
                bbox: { type: 'string' },
                boundingPolygon: { type: 'string' },
                path: { type: 'string' },
                classification: { type: 'string' },
                tool: { type: 'string' },
                password: { type: 'string' },
                defaultRole: { type: 'string' },
                expiration: { type: 'string' },
                inviteOnly: { type: 'string' },
                allowDupe: { type: 'string' },
            }
        },
        res: 'res.Marti.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req);

            const user = await Auth.as_user(config.models, req);
            const auth = (await config.models.Profile.from(user.email)).auth;
            const api = await TAKAPI.init(new URL(String(config.server.api)), new APIAuthCertificate(auth.cert, auth.key));

            const query: any = {};
            for (const q in req.query) query[q] = String(req.query[q]);
            const mission = await api.Mission.create(req.params.name, query);
            return res.json(mission);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.get('/marti/mission', {
        name: 'List Missions',
        group: 'MartiMissions',
        auth: 'user',
        description: 'Helper API to list missions',
        query: {
            type: 'object',
            properties: {
                passwordProtected: {
                    type: 'boolean',
                    default: false,
                },
                defaultRole: {
                    type: 'boolean',
                },
                nameFilter: {
                    type: 'string'
                },
                tool: {
                    type: 'string'
                }
            }
        },
        res: 'res.Marti.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req);

            const user = await Auth.as_user(config.models, req);
            const auth = (await config.models.Profile.from(user.email)).auth;
            const api = await TAKAPI.init(new URL(String(config.server.api)), new APIAuthCertificate(auth.cert, auth.key));

            const query = {};
            for (const q in req.query) query[q] = String(req.query[q]);
            const missions = await api.Mission.list(query);
            return res.json(missions);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.get('/marti/missions/:name/contacts', {
        name: 'Mission Contacts',
        group: 'MartiMissions',
        auth: 'user',
        ':name': 'string',
        description: 'List contacts associated with a mission',
        res: {
            type: 'array',
            items: {
                type: 'object',
                required: [ 'filterGroups', 'notes', 'callsign', 'team', 'role', 'takv', 'uid' ],
                additionalPropeties: false,
                properties: {
                    'filterGroups': { type: 'array', items: { type: 'string' } },
                    'notes': { type: 'string' },
                    'callsign': { type: 'string' },
                    'team': { type: 'string' },
                    'role': { type: 'string' },
                    'takv': { type: 'string' },
                    'uid': { type: 'string' },
                }
            }
        }
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req);

            const user = await Auth.as_user(config.models, req);
            const auth = (await config.models.Profile.from(user.email)).auth;
            const api = await TAKAPI.init(new URL(String(config.server.api)), new APIAuthCertificate(auth.cert, auth.key));

            const missions = await api.Mission.contacts(String(req.params.name));

            return res.json(missions);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.post('/marti/missions/:name/upload', {
        name: 'Mission Upload',
        group: 'MartiMissions',
        auth: 'user',
        ':name': 'string',
        ':hash': 'string',
        description: 'Create an upload',
        query: {
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: {
                name: { type: 'string' }
            }
        },
        res: 'res.Marti.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req);

            const user = await Auth.as_user(config.models, req);
            const profile = await config.models.Profile.from(user.email);
            const auth = profile.auth;
            const creatorUid = profile.username;

            const name = String(req.query.name);

            const api = await TAKAPI.init(new URL(String(config.server.api)), new APIAuthCertificate(auth.cert, auth.key));

            const content = await api.Files.upload({
                name: name,
                contentLength: Number(req.headers['content-length']),
                keywords: [],
                creatorUid: creatorUid,
            }, req);

            // @ts-expect-error Morgan will throw an error after not getting req.ip and there not being req.connection.remoteAddress
            req.connection = {
                // @ts-expect-error
                remoteAddress: req._remoteAddress
            }

            const missionContent = await api.Mission.attachContents(req.params.name, [content.Hash]);

            return res.json(missionContent);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.delete('/marti/missions/:name/upload/:hash', {
        name: 'Mission Upload Delete',
        group: 'MartiMissions',
        auth: 'user',
        ':name': 'string',
        ':hash': 'string',
        description: 'Delete an upload by hash',
        res: 'res.Marti.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req);

            const user = await Auth.as_user(config.models, req);
            const profile = await config.models.Profile.from(user.email);
            const auth = profile.auth;

            const name = String(req.query.name);

            const api = await TAKAPI.init(new URL(String(config.server.api)), new APIAuthCertificate(auth.cert, auth.key));

            const missionContent = await api.Mission.detachContents(req.params.name, req.params.hash);

            return res.json(missionContent);
        } catch (err) {
            return Err.respond(err, res);
        }
    });
}
