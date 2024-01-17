import Config from './config.ts';
import { CoT } from '@tak-ps/node-tak';
import ESRISink from './sinks/esri.ts';
import HookQueue from './aws/hooks.ts';
import Cacher from './cacher.ts';
import { Connection, ConnectionSink } from './schema.ts';
import { type InferSelectModel } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import Modeler from '@openaddresses/batch-generic';

export default class Sinks extends Map<string, any> {
    config: Config;
    queue: HookQueue;

    constructor(config: Config) {
        super();
        this.config = config;
        this.queue = new HookQueue();

        // Include Supported Sink Types Here
        this.set('ArcGIS', ESRISink);
    }

    async cot(conn: InferSelectModel<typeof Connection>, cot: CoT): Promise<boolean> {
        const sinks = await this.config.cacher.get(Cacher.Miss({}, `connection-${conn.id}-sinks`), async () => {
            const ConnectionSinkModel = new Modeler(this.config.pg, ConnectionSink);

            return await ConnectionSinkModel.list({
                where: sql`
                    connection = ${conn.id}
                    AND enabled = True
                `
            });
        });

        for (const sink of sinks.sinks) {
            const handler = this.get(sink.type);

            const secrets = await handler.secrets(this.config, sink);
            const feat = cot.to_geojson();

            const options = {
                logging: sink.logging
            };

            this.queue.submit(conn.id, JSON.stringify({
                id: sink.id,
                type: sink.type,
                body: sink.body,
                feat, secrets, options
            }));
        }

        return true;
    }
}
