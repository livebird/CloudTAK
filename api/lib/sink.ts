// @ts-ignore
import ConnectionSink from './types/connection-sink.js';
import Err from '@openaddresses/batch-error';
import Config from './config.js';

export default class SinkInterface {
    static sink_name(): string {
        return 'generic';
    }

    static async secrets(config: Config, sink: ConnectionSink): Promise<any> {
        return {};
    }
}
