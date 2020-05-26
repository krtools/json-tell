export interface JsonProperty {
  readonly type: 'property';
  readonly key: string;
  readonly types: Set<'number' | 'boolean' | 'null' | 'string' | string>;
  optional?: boolean;
  array?: JsonArray;
}

export interface JsonObject {
  readonly type: 'object';
  readonly name: string;
  readonly key: string;
  readonly props: Map<string, JsonProperty>;
  readonly array?: true;
}

export interface JsonArray {
  readonly type: 'array';
  readonly types: Set<string>;
  array?: JsonArray;
}

export type PrimitiveJsonType = 'number' | 'boolean' | 'null' | 'string';

export type JsonStackElement = JsonProperty | JsonObject | JsonArray;

export interface ToInterfaceOptions {
  exported?: boolean;
  root?: string;
}
