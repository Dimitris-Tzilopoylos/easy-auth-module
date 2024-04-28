export = AuthEvents;
declare class AuthEvents {
    events: {};
    publish(eventName: any, ...args: any[]): void;
    subscribe(eventName: any, listener: any): void;
    subscribeAsync(eventName: any, listener: any): void;
    unSubscribeAll(): void;
    eventsToArray(): any;
}
