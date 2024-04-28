export = MemoryStorage;
declare class MemoryStorage {
    static storage: any;
    static timeouts: {};
    static set(key: any, value: any, ttl: any): Promise<any>;
    static setWithTTL(key: any, value: any, ttl: any): Promise<any>;
    static get(key: any): Promise<any>;
    static delete(key: any): any;
    static validateTTL(ttl: any): boolean;
    static flushAll(): Promise<void>;
}
