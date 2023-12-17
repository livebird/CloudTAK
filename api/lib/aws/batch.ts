// @ts-ignore
import cf from '@openaddresses/cloudfriend';
import Data from '../types/data.js';
import AWSBatch from '@aws-sdk/client-batch';
import Config from '../config.js';
import jwt from 'jsonwebtoken';
import Err from '@openaddresses/batch-error';

export interface BatchJob {
    id: string;
    asset: string;
    status: string;
    created: number;
    updated: number;
    logstream?: string;
}

/**
 * @class
 */
export default class Batch {
    static async submitUser(config: Config, email: string, asset: string, task: object): Promise<AWSBatch.SubmitJobCommandOutput> {
        const batch = new AWSBatch.BatchClient({ region: process.env.AWS_DEFAULT_REGION });

        let jobName = `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}-${asset.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}`;

        const batchres = await batch.send(new AWSBatch.SubmitJobCommand({
            jobName,
            jobQueue: `${config.StackName}-queue`,
            jobDefinition: `${config.StackName}-data-job`,
            containerOverrides: {
                environment: [
                    { name: 'ETL_API',      value:  config.API_URL },
                    { name: 'ETL_BUCKET',   value:  config.Bucket },
                    { name: 'ETL_TOKEN',    value: jwt.sign({ access: 'user', user: email }, config.SigningSecret) },
                    { name: 'ETL_TYPE',     value: 'user' },
                    { name: 'ETL_ID',       value: email },
                    { name: 'ETL_TASK',     value: JSON.stringify({ asset: asset, config: task }) },
                ]
            }
        }));

        return batchres;
    }

    static async submitData(config: Config, data: Data, asset: string, task: object): Promise<AWSBatch.SubmitJobCommandOutput> {
        const batch = new AWSBatch.BatchClient({ region: process.env.AWS_DEFAULT_REGION });

        let jobName = `data-${data.id}-${asset.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}`;

        const batchres = await batch.send(new AWSBatch.SubmitJobCommand({
            jobName,
            jobQueue: `${config.StackName}-queue`,
            jobDefinition: `${config.StackName}-data-job`,
            containerOverrides: {
                environment: [
                    { name: 'ETL_API',      value:  config.API_URL },
                    { name: 'ETL_BUCKET',   value:  config.Bucket },
                    { name: 'ETL_TOKEN',    value: jwt.sign({ access: 'data', data: data.id }, config.SigningSecret) },
                    { name: 'ETL_TYPE',     value: 'data' },
                    { name: 'ETL_ID',       value: String(data.id) },
                    { name: 'ETL_TASK',     value: JSON.stringify({ asset: asset, config: task }) },
                ]
            }
        }));

        return batchres;
    }

    static async job(config: Config, jobid: string): Promise<BatchJob> {
        const batch = new AWSBatch.BatchClient({ region: process.env.AWS_DEFAULT_REGION });

        const jobs = await batch.send(new AWSBatch.DescribeJobsCommand({
            jobs: [jobid]
        }))

        if (!jobs.jobs.length) throw new Err(400, null, 'AWS Does not report this job');

        const job = jobs.jobs[0];

        const name = job.jobName.replace(/data-[0-9]+-/, '');
        let asset: string[] = [...name];
        asset[name.lastIndexOf('_')] = '.';

        return {
            id: job.jobId,
            asset: asset.join(''),
            status: job.status,
            created: job.createdAt,
            updated: job.stoppedAt,
            logstream: job.container.logStreamName
        }
    }

    static async list(config: Config, prefix: string): Promise<BatchJob[]> {
        const batch = new AWSBatch.BatchClient({ region: process.env.AWS_DEFAULT_REGION });

        const jobs = (await batch.send(new AWSBatch.ListJobsCommand({
            jobQueue: `${config.StackName}-queue`,
            filters: [{
                name: 'JOB_NAME',
                values: [`${prefix}-*`]
            }]
        }))).jobSummaryList.map((job) => {
            const name = job.jobName.replace(`${prefix}-`, '');
            let asset: string[] = [...name];
            asset[name.lastIndexOf('_')] = '.';

            return {
                id: job.jobId,
                asset: asset.join(''),
                status: job.status,
                created: job.createdAt,
                updated: job.stoppedAt,
            };
        });

        return jobs;
    }
};
