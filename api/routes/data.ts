import Err from '@openaddresses/batch-error';
import Auth from '../lib/auth.js';
import { Response } from 'express';
import { AuthRequest } from '@tak-ps/blueprint-login';
import { type InferSelectModel } from 'drizzle-orm';
import { Data } from '../lib/schema.js';
import Config from '../lib/config.js';
import S3 from '../lib/aws/s3.js';
import { Param } from '@openaddresses/batch-generic';
import { sql, eq } from 'drizzle-orm';
import DataMission from '../lib/data-mission.js';
import { AuthResourceAccess } from '@tak-ps/blueprint-login';

export default async function router(schema: any, config: Config) {
    await schema.get('/connection/:connectionid/data', {
        name: 'List Data',
        group: 'Data',
        auth: 'user',
        ':connectionid': 'integer',
        description: 'List data',
        query: 'req.query.ListData.json',
        res: 'res.ListData.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req, {
                resources: [{ access: AuthResourceAccess.CONNECTION, id: parseInt(req.params.connectionid) }]
            });

            const list = await config.models.Data.list({
                limit: Number(req.query.limit),
                page: Number(req.query.page),
                order: String(req.query.order),
                sort: String(req.query.sort),
                where: sql`
                    name ~* ${req.query.filter}
                    AND (${Param(req.params.connectionid)}::BIGINT IS NULL OR connection = ${Param(req.params.connectionid)}::BIGINT)
                `
            });

            res.json(list);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.post('/connection/:connectionid/data', {
        name: 'Create data',
        group: 'Data',
        auth: 'admin',
        description: 'Register a new data source',
        ':connectionid': 'integer',
        body: 'req.body.CreateData.json',
        res: 'res.Data.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req, {
                resources: [{ access: AuthResourceAccess.CONNECTION, id: parseInt(req.params.connectionid) }]
            });

            const data = await config.models.Data.generate({
                ...req.body,
                connection: req.params.connectionid
            });

            await DataMission.sync(config, data);

            return res.json(data);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.patch('/connection/:connectionid/data/:dataid', {
        name: 'Update Layer',
        group: 'Data',
        auth: 'admin',
        description: 'Update a data source',
        ':connectionid': 'integer',
        ':dataid': 'integer',
        body: 'req.body.PatchData.json',
        res: 'res.Data.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req, {
                resources: [
                    { access: AuthResourceAccess.DATA, id: parseInt(req.params.dataid) },
                    { access: AuthResourceAccess.CONNECTION, id: parseInt(req.params.connectionid) }
                ]
            });

            let data = await config.models.Data.commit(parseInt(req.params.dataid), {
                updated: sql`Now()`,
                ...req.body
            });

            await DataMission.sync(config, data);

            return res.json(data);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.get('/connection/:connectionid/data/:dataid', {
        name: 'Get Data',
        group: 'Data',
        auth: 'user',
        description: 'Get a data source',
        ':connectionid': 'integer',
        ':dataid': 'integer',
        res: 'res.Data.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req, {
                resources: [
                    { access: AuthResourceAccess.DATA, id: parseInt(req.params.dataid) },
                    { access: AuthResourceAccess.CONNECTION, id: parseInt(req.params.connectionid) }
                ]
            });

            let data = await config.models.Data.from(parseInt(req.params.dataid));
            return res.json(data);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.delete('/connection/:connectionid/data/:dataid', {
        name: 'Delete Data',
        group: 'Data',
        auth: 'user',
        description: 'Delete a data source',
        ':connectionid': 'integer',
        ':dataid': 'integer',
        res: 'res.Standard.json'
    }, async (req: AuthRequest, res: Response) => {
        try {
            await Auth.is_auth(config.models, req, {
                resources: [{ access: AuthResourceAccess.CONNECTION, id: parseInt(req.params.connectionid) }]
            });

            const data = await config.models.Data.from(parseInt(req.params.dataid));

            await S3.del(`data-${String(req.params.dataid)}/`, { recurse: true });
    
            data.mission_sync = false;
            await DataMission.sync(config, data);

            await config.models.Data.delete(parseInt(req.params.dataid));

            return res.json({
                status: 200,
                message: 'Data Deleted'
            });
        } catch (err) {
            return Err.respond(err, res);
        }
    });
}
