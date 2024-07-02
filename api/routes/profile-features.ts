import { Type, Static } from '@sinclair/typebox'
import { coordEach } from '@turf/meta';
import { GenerateUpsert } from '@openaddresses/batch-generic';
import Config from '../lib/config.js';
import Schema from '@openaddresses/batch-schema';
import Err from '@openaddresses/batch-error';
import Auth from '../lib/auth.js';
import { StandardResponse, ProfileFeature } from '../lib/types.js'
import { sql } from 'drizzle-orm';
import * as Default from '../lib/limits.js';

export default async function router(schema: Schema, config: Config) {
    await schema.get('/profile/feature', {
        name: 'Get Features',
        group: 'ProfileFeature',
        description: `
            Return a list of Profile Features
        `,
        query: Type.Object({
            limit: Type.Integer({ default: 1000 }),
            page: Default.Page,
            order: Default.Order
        }),
        res: Type.Object({
            total: Type.Integer(),
            items: Type.Array(ProfileFeature)
        })

    }, async (req, res) => {
        try {
            const user = await Auth.as_user(config, req);

            const list = await config.models.ProfileFeature.list({
                limit: req.query.limit,
                page: req.query.page,
                order: req.query.order,
                where: sql`
                    username = ${user.email}
                `
            });

            return res.json({
                total: list.total,
                items: list.items.map((feat) => {
                    return {
                        id: feat.id,
                        path: feat.path,
                        type: 'Feature',
                        properties: feat.properties,
                        geometry: feat.geometry
                    } as Static<typeof ProfileFeature>
                })
            })
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.delete('/profile/feature', {
        name: 'Delete Feature',
        group: 'ProfileFeature',
        description: `
            Delete features by path
        `,
        query: Type.Object({
            path: Type.String()
        }),
        res: StandardResponse
    }, async (req, res) => {
        try {
            const user = await Auth.as_user(config, req);

            await config.models.ProfileFeature.delete(sql`
                starts_with(path, ${req.query.path}) AND username = ${user.email}
            `);

            return res.json({
                status: 200,
                message: 'Features Deleted'
            });
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.put('/profile/feature', {
        name: 'Upsert Feature',
        group: 'ProfileFeature',
        description: `
            Create or modify a feature
        `,
        query: Type.Object({
            broadcast: Type.Boolean({
                default: false,
                description: `
                    Broadcast featues as CoTs to connected WebSocket clients
                    Used primarily by the Events Task for importing DataPackage CoTs
                `
            })
        }),
        body: ProfileFeature,
        res: ProfileFeature,
    }, async (req, res) => {
        try {
            const user = await Auth.as_user(config, req);

            coordEach(req.body.geometry, (coords) => {
                if (coords.length === 2) coords.push(0);
                return coords
            })

            const feat = await config.models.ProfileFeature.generate({
                id: req.body.id,
                username: user.email,
                properties: req.body.properties,
                geometry: req.body.geometry
            }, {
                upsert: GenerateUpsert.UPDATE
            });

            return res.json({
                id: feat.id,
                path: feat.path,
                type: 'Feature',
                properties: feat.properties,
                geometry: feat.geometry
            } as Static<typeof ProfileFeature>);
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.delete('/profile/feature/:id', {
        name: 'Delete Feature',
        group: 'ProfileFeature',
        description: `
            Delete a feature
        `,
        params: Type.Object({
            id: Type.String()
        }),
        res: StandardResponse
    }, async (req, res) => {
        try {
            const user = await Auth.as_user(config, req);

            await config.models.ProfileFeature.delete(sql`
                id = ${req.params.id} AND username = ${user.email}
            `);

            return res.json({
                status: 200,
                message: 'Feature Deleted'
            });
        } catch (err) {
            return Err.respond(err, res);
        }
    });

    await schema.get('/profile/feature/:id', {
        name: 'Get Feature',
        group: 'ProfileFeature',
        description: `
            Delete a feature
        `,
        params: Type.Object({
            id: Type.String()
        }),
        res: ProfileFeature
    }, async (req, res) => {
        try {
            const user = await Auth.as_user(config, req);

            const feat = await config.models.ProfileFeature.from(sql`
                id = ${req.params.id} AND username = ${user.email}
            `);

            return res.json({
                type: 'Feature',
                ...feat
            } as Static<typeof ProfileFeature>)
        } catch (err) {
            return Err.respond(err, res);
        }
    });
}
