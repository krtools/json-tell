import {ToInterfaceOptions, JsonArray, JsonObject} from './types';
import {TypesGenerator} from './TypesGenerator';

export {ToInterfaceOptions};

/**
 * Generate a string containing the typescript interfaces
 * @param json the json object to parse
 * @param opts the generation options (optional)
 */
export function getTypes(json: any, opts: ToInterfaceOptions = {}): string {
  const type = typeof json;
  if (type === 'object' && json !== null) {
    const root = opts.root || 'RootObject';
    const gen = new TypesGenerator();
    gen.defaultRoot = root;
    const _json = Array.isArray(json) ? {root: json} : json;
    walkJSON(_json, gen);
    return toInterfaces(gen, opts, _json !== json ? root : undefined);
  }

  const root = opts.root || 'RootType';
  const exported = opts.exported ? '`export ' : '';
  switch (type) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'string':
    case 'symbol':
      return `${exported}type ${root} = ${type};`;
    default:
      return `${exported}type ${root} = ${json === null ? 'null' : 'unknown'};`;
  }
}

function stringifyArrayTypes(arr: JsonArray): string {
  const types: string[] = [];
  if (arr.array) {
    types.push(stringifyArrayTypes(arr.array));
  }
  if (arr.types) {
    types.push(...Array.from(arr.types));
  }
  const len = types.length;
  return len === 0 ? 'unknown[]' : len === 1 ? `${types[0]}[]` : `Array<${types.join(' | ')}>`;
}

function toInterfaces(gen: TypesGenerator, opts: ToInterfaceOptions, removeRoot?: string) {
  let out = '';
  if (removeRoot !== undefined) {
    for (const key of gen.contexts.keys()) {
      const obj = gen.contexts.get(key)!;
      if (obj.name === removeRoot) {
        gen.contexts.delete(key);
        const root = obj.props.get('root')!;
        const types = [...root.types, ...(root.array ? [stringifyArrayTypes(root.array)] : [])];
        out += types ? `${opts.exported ? 'export ' : ''}type ${obj.name} = ${types.join(' | ')};` : '';
        break;
      }
    }
  }

  for (const value of gen.contexts.values()) {
    out += (out.length ? '\n\n' : '') + toInterface(value, opts);
  }
  return out;
}

function toInterface(obj: JsonObject, opts: ToInterfaceOptions = {}): string {
  const exported = opts.exported ? 'export ' : '';

  const props: string[] = [];
  for (const [key, value] of obj.props) {
    const types: string[] = [...value.types];
    if (value.array) {
      types.push(stringifyArrayTypes(value.array));
    }
    const optional = value.optional ? '?' : '';
    const pkey = /^\w+$/.test(key) ? key : `'${JSON.stringify(key).slice(1, -1).replace(/'/g, "\\'")}'`;
    props.push(`  ${pkey}${optional}: ${types.join(' | ')};`);
  }
  return `${exported}interface ${obj.name} {\n${props.join('\n')}\n}`;
}

function walkJSON(json: any, gen = new TypesGenerator()): TypesGenerator {
  _walkJSON(json, gen);
  return gen;
}

function _walkJSON(json: any, gen: TypesGenerator): void {
  const type = typeof json;

  switch (type) {
    case 'object':
      if (json === null) {
        gen.addType('null');
      } else if (Array.isArray(json)) {
        gen.enterArray();
        for (let i = 0; i < json.length; i++) {
          _walkJSON(json[i], gen);
        }
        gen.exit();
      } else {
        gen.enterObject();
        const keys = Object.keys(json as object);
        gen.listProperties(keys);
        for (const key of keys) {
          gen.enterProperty(key);
          _walkJSON(json[key], gen);
          gen.exit();
        }
        gen.exit();
      }
      break;
    case 'boolean':
    case 'number':
    case 'string':
      gen.addType(type);
      break;
  }
}
