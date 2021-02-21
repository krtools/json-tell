import test from 'ava';
import {getTypes} from '../src';
import {parseTypes} from './util';

test('just a number', (t) => {
  const type = getTypes(1);
  t.is(type, 'type RootType = number;');
});

test('just a string', (t) => {
  const type = getTypes('');
  t.is(type, 'type RootType = string;');
});

test('just null', (t) => {
  const type = getTypes(null);
  t.is(type, 'type RootType = null;');
});

test('just a boolean', (t) => {
  const type = getTypes(true);
  t.is(type, 'type RootType = boolean;');
});

test('array of strings', (t) => {
  const type = getTypes(['', '']);
  t.log(type);
  t.regex(type, /type RootObject = string\[];/);
});

test('array of string | string[]', (t) => {
  const type = getTypes(['', ['', '']]);
  t.log(type);
  t.is(type, 'type RootObject = Array<string[] | string>;');
});

test('array of [string,number]', (t) => {
  const type = getTypes(['', 0]);
  t.log(type);
  t.regex(type, /type RootObject = Array<string | number>;/);
});

test("array of [{str:''}]", (t) => {
  const type = getTypes([{str: ''}]);
  t.log(type);
  t.regex(type, /type RootObject = Root\[];\n\ninterface Root {\n  str: string;/);
});

test('sanity check', (t) => {
  const types = getTypes({str: ''});
  t.is(
    types,
    `interface RootObject {
  str: string;
}`
  );
});

test('Object with quoted property', (t) => {
  const ints = parseTypes(getTypes({"a v'alue": ''}));

  t.deepEqual(ints[0], {
    exported: false,
    name: 'RootObject',
    properties: [
      {
        name: "a v'alue",
        type: 'string',
        optional: false
      }
    ]
  });
});

test('Object with non-default root name', (t) => {
  const ints = parseTypes(getTypes({str: ''}, {root: 'MyRoot'}));
  t.deepEqual(ints[0], {
    name: 'MyRoot',
    exported: false,
    properties: [
      {
        name: 'str',
        type: 'string',
        optional: false
      }
    ]
  });
});

test('Exported interfaces', (t) => {
  const ints = parseTypes(getTypes({val: {str: ''}}, {exported: true}));
  t.deepEqual(
    ints.map((e) => e.exported),
    [true, true]
  );
});

test('Object with 1x string', async (t) => {
  const ints = parseTypes(getTypes({str: ''}));
  t.is(ints.length, 1);
  t.is(ints[0].name, 'RootObject');

  t.is(ints[0].properties.length, 1);
  t.is(ints[0].properties[0].type, 'string');
});

test('Object with 2x string', async (t) => {
  const ints = parseTypes(getTypes({str1: '', str2: ''}));
  t.is(ints.length, 1);
  t.is(ints[0].properties.length, 2);
  for (const property of ints[0].properties) {
    t.is(property.type, 'string');
  }
});

test('Object with 1x [string]', async (t) => {
  const ints = parseTypes(getTypes({str1: ['']}));
  t.is(ints.length, 1);
  t.is(ints[0].properties.length, 1);
  t.is(ints[0].properties[0].type, 'string[]');
});

test('Object with 1x [string, string]', async (t) => {
  const ints = parseTypes(getTypes({str1: ['a', 'b']}));
  t.is(ints.length, 1);
  t.is(ints[0].properties.length, 1);
  t.is(ints[0].properties[0].type, 'string[]');
});

test('Object with 1x [string, number]', async (t) => {
  const ints = parseTypes(getTypes({str1: ['a', 1]}));
  t.is(ints.length, 1);
  t.is(ints[0].properties.length, 1);
  t.is(ints[0].properties[0].type, 'Array<string | number>');
});

test('Object with 1x [[string]]', async (t) => {
  const ints = parseTypes(getTypes({str1: [['a']]}));
  t.is(ints.length, 1);
  t.is(ints[0].properties.length, 1);
  t.is(ints[0].properties[0].type, 'string[][]');
});

test('Object with 1x [[string, number]]', async (t) => {
  const ints = parseTypes(getTypes({str1: [['a', 1]]}));
  t.is(ints.length, 1);
  t.is(ints[0].properties.length, 1);
  t.is(ints[0].properties[0].type, 'Array<string | number>[]');
});

test('Object with 1x []', async (t) => {
  const ints = parseTypes(getTypes({str1: []}));
  t.is(ints.length, 1);
  t.is(ints[0].properties.length, 1);
  t.is(ints[0].properties[0].type, 'unknown[]');
});

test('Object with 1x [][]', async (t) => {
  const ints = parseTypes(getTypes({str1: [[]]}));
  t.is(ints.length, 1);
  t.is(ints[0].properties.length, 1);
  t.is(ints[0].properties[0].type, 'unknown[][]');
});

test('Object with 1x array of {val:string}', async (t) => {
  const ints = parseTypes(getTypes({val: [{str: ''}, {str: ''}]}));
  t.is(ints.length, 2);
  const [Root, Val] = ints;

  t.deepEqual(Root.properties[0], {
    name: 'val',
    type: 'Val[]',
    optional: false
  });

  t.deepEqual(Val.properties[0], {
    name: 'str',
    optional: false,
    type: 'string'
  });
});

test('Object with optional property str', async (t) => {
  const ints = parseTypes(getTypes({val: [{str: 'x'}, {}]}));
  t.is(ints.length, 2);
  t.is(ints[1].properties.length, 1);
  const Val = ints[1];

  t.deepEqual(Val, {
    name: 'Val',
    exported: false,
    properties: [
      {
        name: 'str',
        optional: true,
        type: 'string'
      }
    ]
  });
});
