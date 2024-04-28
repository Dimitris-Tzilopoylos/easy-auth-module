"use strict";

const {
  EventEmitter
} = require("events");
class AuthEvents extends EventEmitter {
  constructor() {
    super();
    this.events = {};
  }
  publish(eventName, ...args) {
    this.emit(eventName, ...args);
  }
  subscribe(eventName, listener) {
    if (!this.eventNames().some(x => x === eventName) && !this.events[eventName]) {
      this.events[eventName] = {};
      this.on(eventName, listener);
      const unsubscribe = () => this.removeListener(eventName, listener);
      this.events[eventName] = {
        listener,
        unsubscribe
      };
    }
  }
  subscribeAsync(eventName, listener) {
    if (!this.eventNames().some(x => x === eventName) && !this.events[eventName]) {
      this.events[eventName] = {};
      this.on(eventName, listener);
      const unsubscribe = () => this.removeListener(eventName, listener);
      this.events[eventName] = {
        listener,
        unsubscribe,
        eventName
      };
    }
  }
  unSubscribeAll() {
    this.eventsToArray().forEach(({
      unsubscribe
    }) => {
      unsubscribe();
    });
  }
  eventsToArray() {
    return Object.values(this.events);
  }
}
module.exports = AuthEvents;