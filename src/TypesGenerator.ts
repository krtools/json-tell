import {JsonStackElement, PrimitiveJsonType, JsonObject, JsonProperty} from './types';

export function uniqKey(map: Set<string>, baseKey: string): string {
  if (!map.has(baseKey)) return baseKey;

  for (let i = 1; ; i++) {
    const key = `${baseKey}_${i}`;
    if (!map.has(key)) return key;
  }
}

/** Contains the type information for visited JSON elements */
export class TypesGenerator {
  public defaultRoot = 'RootObject';

  // <joined pathStack, saved JsonContext>
  public readonly contexts = new Map<string, JsonObject>();
  private readonly names = new Set<string>();

  public readonly stack: JsonStackElement[] = [];

  private get current(): JsonStackElement {
    return this.stack[this.stack.length - 1];
  }

  private get path(): string {
    return this.stack
      .filter((e) => e.type === 'property')
      .map((e) => `[${JSON.stringify((e as JsonProperty).key)}]`)
      .join('');
  }

  private property(): JsonProperty | undefined {
    const arr = this.stack;
    for (let i = arr.length - 1; i > 0; i--) {
      const item = arr[i];
      if (item.type === 'property') {
        return item;
      }
    }
  }

  public enterArray(): void {
    const current = this.current;
    const prop = current.type === 'array' ? current : this.property();
    let arr = prop && prop?.array;
    if (!arr) {
      arr = {type: 'array', types: new Set()};
      if (prop) {
        prop.array = arr;
      }
    }
    this.stack.push(arr);
  }

  public enterObject(): void {
    const prop = this.property();
    const current = this.current;
    if (current && current.type === 'object') {
      throw new Error('cannot only enter an object from a property or array');
    }

    const path = this.path;
    let object: JsonObject;
    if (this.contexts.has(path)) {
      object = this.contexts.get(path)!;
    } else {
      const key = (prop ? prop.key || '_' : this.defaultRoot).replace(/^[^_$a-z]|\W/gi, '') || '_';
      const name = uniqKey(this.names, `${key[0].toUpperCase()}${key.slice(1)}`);
      this.names.add(name);
      object = {
        type: 'object' as const,
        name: name,
        // no parent property, this is the top-level object
        key: key,
        props: new Map()
      };
      if (current) {
        current.types.add(name);
      }
      this.contexts.set(path, object);
    }
    this.stack.push(object);
  }

  public enterProperty(key: string): void {
    const current = this.current;
    if (current.type !== 'object') {
      throw new Error('Can only add properties on an object');
    }
    let prop = current.props.get(key);
    if (!prop) {
      prop = {type: 'property', key, types: new Set()};
      current.props.set(key, prop);
    }
    this.stack.push(prop);
  }

  /** as a rule this can only happen in an array/prop context */
  public addType(type: PrimitiveJsonType): void {
    const current = this.current;
    if (current.type === 'object') {
      throw new Error('Cannot add type to object');
    }
    current.types.add(type);
  }

  /** Move up in context. consumer is trusted to do this in the right order */
  public exit(): void {
    this.stack.pop();
  }

  public listProperties(keys: string[]) {
    const current = this.current as JsonObject;
    for (const key of current.props.keys()) {
      if (!keys.includes(key)) {
        current.props.get(key)!.optional = true;
      }
    }
  }
}
