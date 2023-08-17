/**
 * Populate fill invalid settings with defaults
 * @param {Object} settings
 * @returns Settings
 */
function fillDefaultSettings(settings) {
    if (typeof settings.chime != 'string') {
        settings.chime = 'default';
    }

    if (typeof settings.volume != 'number' || settings.volume > 1 || settings.volume < 0) {
        settings.volume = 1;
    }

    if (typeof settings.timezone != 'string') {
        settings.timezone = 'auto';
    }

    return settings;
}

class ChimeManager {

    static #instance = null;
    #chimes = null;

    static getInstance() {
        if (this.#instance == null) {
            this.#instance = new ChimeManager();
        }

        return this.#instance;
    }

    /**
     * Get chime key
     * @param {Number} hour
     * @returns Key
     */
    #getKey(hour) {
        return `customChime${hour}`;
    }

    /**
     * Get chime
     * @param {Number} hour
     */
    async get(hour) {
        const key = this.#getKey(hour);
        const data = await browser.storage.local.get([key]);

        if (typeof data[key] != 'object') {
            return null;
        }

        return data[key];
    }

    /**
     * Set chime
     * @param {Number} hour
     * @param {String} name
     * @param {String} data
     */
    async set(hour, name, data) {
        await this.list(true);
        this.#chimes.add(hour);

        const newData = {};
        newData['customChimes'] = Array.from(this.#chimes);
        newData[this.#getKey(hour)] = {
            name: name,
            data: data
        };

        await browser.storage.local.set(newData);
    }

    /**
     * Delete chime
     * @param {Number} hour
     */
    async delete(hour) {
        this.list(true);
        this.#chimes.delete(hour);

        const newData = {};
        newData['customChimes'] = Array.from(this.#chimes);
        newData[this.#getKey(hour)];

        await browser.storage.local.set(newData);
        await this.list(true);
        await browser.storage.local.remove(this.#getKey(hour));
    }

    /**
     * Delete all chimes
     */
    async clear() {
        const chimes = await this.list(true);
        const newData = {};

        for (const hour of chimes) {
            newData[this.#getKey(hour)] = null;
        }

        newData['customChimes'] = [];
        this.#chimes.clear();
        await browser.storage.local.set(newData);
        await browser.storage.local.remove(Object.keys(newData));
    }

    /**
     * List all chime keys
     * @param {Boolean} forceReload
     */
    async list(forceReload) {
        if (forceReload || this.#chimes == null) {
            const data = await browser.storage.local.get(['customChimes']);
            if (typeof data.customChimes != 'object') {
                data.customChimes = [];
            }

            this.#chimes = new Set(data.customChimes);
        }

        return Array.from(this.#chimes);
    }

    /**
     * Check if chime exists
     * @param {Number} hour
     */
    async has(hour) {
        await this.list(false);
        return this.#chimes.has(hour);
    }

}