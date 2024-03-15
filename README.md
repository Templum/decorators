# @templum/decorators

This library is exclusively published in the JavaScript Registry ([JSR](https://jsr.io/)) and offers a variety of decorators with different functionalities. They are based on TypeScript 5.0 decorators and don't require the legacy flag.

## Installation

Deno:
```sh
deno add @templum/decorators
```

NPM (use any of npx, yarn dlx, pnpm dlx, or bunx):
```sh
npx jsr add @templum/decorators
```

Afterwards can be used like any ESModule:
```TypeScript
import { Once } from "@templum/decorators";

class Test {
    @Once()
    public init(): void {
        ...
    }
}
```

## Documentation

Follows...