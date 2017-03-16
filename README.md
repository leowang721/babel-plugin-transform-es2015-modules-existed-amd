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

    var a = _interopRequireDefault(require('a'));
    var c = _interopRequireDefault(require('b')).c;
    var d = _interopRequireDefault(require('e')).f.g;

    _interopRequireDefault(require('lodash'));
    _interopRequireDefault(require('wer'))();

    function t() {
        _interopRequireDefault(require('sss')).go();
    }

    require(['aaa']);

    var __esModuleAMDExport = {
        default: { hello: 'world' },
        __esModule: true
    };
    return __esModuleAMDExport;

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj.default : obj;
    }
});
```
