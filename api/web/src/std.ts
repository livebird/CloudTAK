import type { APIError } from './types.js'
import type { Router } from 'vue-router'

export function stdurl(url: string | URL): URL {
    try {
        url = new URL(url);
    } catch (err) {
        url = new URL(url, window.location.origin);
    }

    // Allow serving through Vue for hotloading
    if (url.hostname === 'localhost') url.port = '5001'

    return url;
}

/**
 * Standardize interactions with the backend API
 *
 * @param {URL|String} url      - Full URL or API fragment to request
 * @param {Object} [opts={}]    - Options
 */
export async function std(
    url: string | URL,
    opts: {
        download?: boolean | string;
        headers?: Record<string, string>;
        body?: any;
        method?: string;
    } = {}
): Promise<any> {
    url = stdurl(url)
    if (!opts) opts = {};

    if (!opts.headers) opts.headers = {};

    if (!(opts.body instanceof FormData) && typeof opts.body === 'object' && !opts.headers['Content-Type']) {
        opts.body = JSON.stringify(opts.body);
        opts.headers['Content-Type'] = 'application/json';
    }

    if (localStorage.token && !opts.headers.Authorization) {
        opts.headers['Authorization'] = 'Bearer ' + localStorage.token;
    }

    const res = await fetch(url, opts);

    let bdy = {};
    if ((res.status < 200 || res.status >= 400) && ![401].includes(res.status)) {
        try {
            bdy = await res.json();
        } catch (err) {
            throw new Error(`Status Code: ${res.status}`);
        }

        const errbody = bdy as APIError;
        const err = new Error(errbody.message || `Status Code: ${res.status}`);
        // @ts-expect-error TODO Fix this
        err.body = bdy;
        throw err;
    } else if (res.status === 401) {
        delete localStorage.token;
        throw new Error('401');
    }

    const ContentType = res.headers.get('Content-Type');

    if (opts.download) {
        const object = new File([await res.blob()], typeof opts.download === 'string' ? opts.download : 'download');
        const file = window.URL.createObjectURL(object);
        window.location.assign(file);
        return res;
    } else if (ContentType && ContentType.includes('application/json')) {
        return await res.json();
    } else {
        return res;
    }
}

export function stdclick($router: Router, event: KeyboardEvent, path: string) {
    if (event.ctrlKey === true) {
        const routeData = $router.resolve(path);
        window.open(routeData.href, '_blank');
    } else {
        $router.push(path);
    }
}
