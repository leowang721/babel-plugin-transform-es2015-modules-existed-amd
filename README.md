# babel-plugin-transform-es2015-modules-existed-amd
This plugin transforms old AMD modules to fit those transformed from ES2015 modules by babel6.

For those old modules of AMD, like

```
define(function(require) {
    'use strict';
    var a = require('a');
    return {hello: 'world'};
});
```

1. add `.default` to require
2. add `default` to return

in .babelrc
```
{
    "presets": ["es2015"],
    "plugins": [
        "transform-es2015-modules-amd",
        "transform-es2015-modules-existed-amd"
    ]
}
```

## Example

In:
```
define(function(require) {
    'use strict';
    var a = require('a');
    var c = require('b').c;
    var d = require('e').f.g;

    require('lodash');
    require('wer')();

    function t() {
        require('sss').go();
    }

    require(['aaa']);

    return {hello: 'world'};
});
```

Out:
```
define(function (require) {
    'use strict';

    var a = require('a').default;
    var c = require('b').default.c;
    var d = require('e').default.f.g;

    require('lodash');
    require('wer').default();

    function t() {
        require('sss').default.go();
    }

    require(['aaa']);

    var __esModuleAMDExport = { hello: 'world' };

    return __esModuleAMDExport;
});
```
