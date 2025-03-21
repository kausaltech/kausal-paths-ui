/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * LRU & TTL fast in-memory cache
 * Promise supported
 * Upsert supported
 * Permanent items supported
 *
 * copied from https://github.com/rafikalid/lru-ttl-cache/blob/master/src/index.ts
 * Copyright (c) 2020 rafikalid (MIT License)
 */

/** Options */
export interface ConstOptions<K, V> {
  /** Max entries @default Infinity */
  max?: number;
  /** Max bytes @default Infinity */
  maxBytes?: number;
  /** Time to live @default Infinity */
  ttl?: number;
  /** TTL check interval in ms. @default 60s */
  ttlInterval?: number;
  /** Upsert callback: enables to create missing elements */
  upsert?:
    | ((key: K, additionalArgs?: any[]) => UpsertResult<V> | Promise<UpsertResult<V>>)
    | undefined;
  /** onEvict callback: enables to handle element eviction */
  onEvict: (metadata: Metadata<K, V>) => void;
}

/** Upsert result */
export interface UpsertResult<V> {
  value: V;
  bytes?: number;
  ttl?: number;
}

/** NodeChain */
interface NodeChain {
  /** Previous element */
  _prev?: NodeChain;
  /** Next element */
  _next?: NodeChain;
}

/** Node interface for LRU */
interface Node<K, V> extends NodeChain {
  value: V | Promise<V>;
  key: K;
  /** Object size */
  bytes: number;
  /** Created timestamp */
  createdAt: number;
  /** Last access */
  lastAccess: number;
  /** Item-specific ttl */
  ttl: number;
}

export interface Metadata<K, V> {
  value: V | Promise<V>;
  key: K;
  /** Created timestamp */
  createdAt: number;
  /** Last access */
  lastAccess: number;
  /** Item-specific ttl */
  ttl: number;
}

type NodeReadOnly<K, V> = Readonly<Node<K, V>>;

/** Main interface */
export default class LRUCache<K, V> implements NodeChain {
  private _map: Map<K, Node<K, V>> = new Map<K, Node<K, V>>();
  /** Max temp elements */
  private _max: number;
  private _maxBytes: number; // max bytes for temp entries
  /** TLL */
  private _ttl: number;
  private _ttlInterval: number;
  private _ttlP?: NodeJS.Timeout = undefined;
  private _upsert?: ConstOptions<K, V>['upsert'];
  private _onEvict?: ConstOptions<K, V>['onEvict'];

  /** Temp elements count */
  private _tmpSize: number = 0;
  /** Total bytes inside the cache */
  private _totalBytes: number = 0;
  /** Temp entries bytes */
  private _tmpBytes: number = 0;
  /** Last used element */
  _next: NodeChain = this;
  /** Least used element */
  _prev: NodeChain = this;

  constructor(options?: ConstOptions<K, V>) {
    // Set config
    if (options) {
      // max entries
      this._max = options.max == null ? Infinity : options.max;
      // max bytes
      this._maxBytes = options.maxBytes ?? Infinity;
      // TTL
      this._ttl = options.ttl ?? Infinity;
      // TTL interval
      this._ttlInterval = options.ttlInterval ?? Infinity;
      this._upsert = options.upsert;
      this._onEvict = options.onEvict;
    } else {
      this._max = Infinity;
      this._maxBytes = Infinity;
      this._ttl = Infinity;
      this._ttlInterval = 5000;
    }
    // fix ttl interval
    if (this.ttlInterval > this.ttl) this.ttlInterval = this.ttl;
    // init chain
    this._prev = this._next = this;
  }

  /** Set max */
  get max() {
    return this._max;
  }
  set max(max: number) {
    this._max = max;
  }

  get maxBytes() {
    return this._maxBytes;
  }
  set maxBytes(maxBytes: number) {
    this._maxBytes = maxBytes;
  }

  get ttl() {
    return this._ttl;
  }
  set ttl(ttl: number) {
    this._ttl = ttl;
  }

  get ttlInterval() {
    return this._ttlInterval;
  }
  set ttlInterval(ttlInterval: number) {
    this._ttlInterval = ttlInterval;
    // fix ttl interval
    if (this.ttlInterval > this.ttl) this.ttlInterval = this.ttl;
    // reload cleaner
    if (this._ttlP) {
      clearInterval(this._ttlP);
      const interv = setInterval(this._ttlClean.bind(this), this._ttlInterval);
      this._ttlP = interv;
      interv.unref?.();
    }
  }

  get upsertCb() {
    return this._upsert;
  }
  set upsertCb(cb: ConstOptions<K, V>['upsert']) {
    this._upsert = cb;
  }

  /** Get total bytes */
  get bytes() {
    return this._totalBytes;
  }
  /** Temp entries bytes */
  get tmpBytes() {
    return this._tmpBytes;
  }

  /** Get cache size */
  get size(): number {
    return this._map.size;
  }

  /** Get temp elements count */
  get tmpSize(): number {
    return this._tmpSize;
  }

  /** Check if cache has key */
  has(key: K) {
    return this._map.has(key);
  }

  /** Set value */
  set(key: K, value: V | Promise<V>, bytes: number = 0, ttl: number | undefined = undefined): this {
    let item: Node<K, V> | undefined;
    if (ttl === undefined) ttl = this._ttl;
    if ((item = this._map.get(key))) {
      if (item.value === value && item.bytes === bytes && item.ttl === ttl) {
        item.lastAccess = Date.now();
        return this;
      }
      this._delete(item);
    }
    this._set(key, value, bytes, ttl);
    return this;
  }

  /** Add permanent element to the cache (will persist until user removes it manually) */
  setPermanent(key: K, value: V, bytes: number = 0): this {
    return this.set(key, value, bytes, Infinity);
  }

  /** @private Insert new item */
  private _set(key: K, value: V | Promise<V>, bytes: number, ttl: number): Node<K, V> {
    const now = Date.now();
    const ele: Node<K, V> = {
      key,
      value,
      bytes,
      createdAt: now,
      lastAccess: now,
      ttl,
      _prev: undefined,
      _next: undefined,
    };
    // add to map
    this._map.set(key, ele);
    // Flags
    this._totalBytes += bytes;
    // add to chain
    if (ttl != Infinity) {
      const p = this._next;
      p._prev = ele;
      ele._next = p;
      ele._prev = this;
      this._next = ele;
      // Flags
      this._tmpSize++; // inc tmp counter
      this._tmpBytes += bytes;
      // remove last permanent element
      if (this._tmpSize > this._max) this._delete(this._prev as Node<K, V>); // Remove least used element
      // remove until maxBytes
      while (this._tmpBytes > this._maxBytes && this._prev != this) {
        this._delete(this._prev as Node<K, V>);
      }
      // Run TTL
      if (!this._ttlP) this._ttlP = setInterval(this._ttlClean.bind(this), this._ttlInterval);
    }
    return ele;
  }

  get(key: K): V | undefined;

  /** Get element from the cache */
  get(key: K, upsert?: boolean, additionalUpsertCbArgs?: any[]): V | Promise<V> | undefined {
    let ele: Node<K, V> | undefined;
    let p: NodeChain;
    let p2: NodeChain;
    if ((ele = this._map.get(key))) {
      ele.lastAccess = Date.now();
      if (ele.ttl != Infinity && ele._prev !== this) {
        // Remove from chain
        p = ele._next!;
        p2 = ele._prev!;
        p2!._next = p;
        p._prev = p2;
        // bring forward
        p = this._next;
        p._prev = ele;
        ele._next = p;
        ele._prev = this;
        this._next = ele;
      }
      return ele.value;
    } else if (upsert) {
      if (typeof this._upsert !== 'function') throw new Error('Missing upsert callback!');
      const upsertResult = this._upsert(key, additionalUpsertCbArgs);
      if (upsertResult instanceof Promise) {
        ele = this._set(
          key,
          upsertResult.then(({ value }) => value),
          0,
          Infinity
        );
        return upsertResult.then((r: UpsertResult<V>) => {
          // Check object not modified
          if (ele === this._map.get(key)) {
            this._delete(ele!);
            this._set(key, r.value, r.bytes || 0, this._ttl);
          }
          return r.value;
        });
      } else {
        this._set(key, upsertResult.value, upsertResult.bytes || 0, this._ttl);
        return upsertResult.value;
      }
    } else return undefined;
  }
  /** Get element from the cache without changing it's timeout and LRU */
  peek(key: K): V | Promise<V> | undefined {
    return this._map.get(key)?.value;
  }

  /** Get and remove Least used element */
  pop(): V | Promise<V> | undefined {
    if (this._prev !== this) {
      const oldest = this._prev as Node<K, V>;
      this._delete(oldest);
      return oldest.value;
    }
    return undefined;
  }

  /** Get least recently used item */
  getLRU() {
    return this._prev !== this ? (this._prev as Node<K, V>).value : undefined;
  }

  /** Upsert element in the cache */
  upsert(
    /** Cache key */
    key: K,
    /** Additional args for upsert callback */
    ...args: any[]
  ): V | Promise<V> {
    return this.get(key, true, args)!;
  }

  /** Delete element from the cache */
  delete(key: K): this {
    const el: Node<K, V> | undefined = this._map.get(key);
    if (el) this._delete(el);
    return this;
  }

  /** @private remove element from cache */
  private _delete(ele: Node<K, V>) {
    // remove from map
    this._map.delete(ele.key);
    // remove from chain
    const bytes = ele.bytes;
    if (ele.ttl != Infinity) {
      const p = ele._next!;
      const p2 = ele._prev!;
      p._prev = p2;
      p2._next = p;
      // adjust cache bytes
      this._tmpBytes -= bytes;
      this._tmpSize--;
    }
    // Adjust total bytes
    this._totalBytes -= bytes;
  }

  /** Clear all the cache excluding permanent items */
  clearTemp() {
    let el = this._prev as NodeChain;
    const map = this._map;
    // @ts-ignore
    while (el !== this) {
      map.delete((el as Node<K, V>).key);
      el = el._next!;
    }
    this._next = this._prev = this;
    this._totalBytes -= this._tmpBytes;
    this._tmpBytes = 0;
    this._tmpSize = 0;
  }

  /** Clear all items in the cache including permanent items */
  clearAll() {
    this._next = this._prev = this;
    this._map.clear();
    this._tmpBytes = this._tmpSize = this._totalBytes = 0;
  }

  /** Get entries */
  *entries(): IterableIterator<[K, V | Promise<V>]> {
    const it = this._map.entries();
    let p = it.next();
    let v: [K, Node<K, V>];
    while (!p.done) {
      v = p.value;
      yield [v[0], v[1].value];
      p = it.next();
    }
  }

  /** Get all keys */
  keys(): IterableIterator<K> {
    return this._map.keys();
  }

  /** Values */
  *values(): IterableIterator<V | Promise<V>> {
    const it = this._map.values();
    const p = it.next();
    while (!p.done) {
      yield p.value.value;
    }
  }

  /** ForEach */
  forEach(cb: (value: V | Promise<V>, key: K, cache: this) => void, thisArg: any) {
    const it = this._map.values();
    const p = it.next();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    if (arguments.length === 1) thisArg = this;
    while (!p.done) {
      const e = p.value;
      cb.call(thisArg, e.value, e.key, this);
    }
  }

  /** TTL CLean */
  _ttlClean() {
    // Find last node to keep
    const now = Date.now();
    let p = this._prev as Node<K, V>;
    let bytes = 0;
    const map = this._map;
    while ((p as NodeChain) !== this && p.lastAccess + p.ttl < now) {
      bytes += p.bytes;
      map.delete(p.key);
      if (this._onEvict !== undefined) {
        this._onEvict(p as Metadata<K, V>);
      }
      p = p._prev as Node<K, V>;
    }
    // Remove other nodes
    if ((p as NodeChain) === this) {
      // Remove all nodes
      this._prev = this._next = this;
      this._totalBytes -= bytes;
      if (this._totalBytes < 0) this._totalBytes = 0;
      this._tmpBytes = this._tmpSize = 0;
      // Break ttl
      clearInterval(this._ttlP!);
      this._ttlP = undefined;
    } else {
      this._prev = p;
      p._next = this;
    }
  }

  /** For(of) */
  *[Symbol.iterator]() {
    const it = this._map.values();
    const v = it.next();
    while (!v.done) {
      const entry = v.value;
      yield [entry.key, entry.value];
    }
  }

  /** Get element metadata */
  getMetadata(key: K): NodeReadOnly<K, V> | undefined {
    const el = this._map.get(key);
    return el == null ? el : { ...el };
  }
}
