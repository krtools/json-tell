import {format} from 'prettier';

export interface InterfaceProperty {
  name: string;
  type: string;
  optional: boolean;
}

export interface ParsedInterface {
  name: string;
  exported: boolean;
  properties: InterfaceProperty[];
}

export function parseTypes(str: string): ParsedInterface[] {
  // quick check for valid typescript
  format(str, {parser: 'typescript'});
  const interfaces: ParsedInterface[] = [];

  const matches = str.matchAll(/^ *(export )?interface (\S+) {\n(.*?)\n}/gms);
  for (const match of matches) {
    const props: InterfaceProperty[] = [];
    for (const propMatch of match[3]!.matchAll(/^ +('(?:\\\\|\\'|[^'])+'|[^']\S*[^?])(\?)?: (.+);/gm)) {
      props.push({
        name: propMatch[1]!.startsWith("'") ? eval(propMatch[1]!) : propMatch[1]!,
        optional: !!propMatch[2]!,
        type: propMatch[3]!
      });
    }

    interfaces.push({
      name: match[2],
      exported: !!match[1],
      properties: props
    });
  }

  return interfaces;
}
