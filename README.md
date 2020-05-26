# json-tell

Generates TypeScript interfaces from a JSON object

- Node 10+
- Zero Dependencies

#### Installation

```
npm install json-tell
```

```
yarn add json-tell
```

#### Usage

```tsx
import {getTypes} from 'json-tell';

const options = {
  exported: true
};

const json = getJsonFromSomewhere();
console.log(getTypes(json, options));
```

#### Options

- `exported`: If true, will add `export` to all interfaces
- `root`: Specify the name of the root object interface (defaults to `'RootObject'`)
