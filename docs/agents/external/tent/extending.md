[← Back to How to Use darthjee/tent](../HOW_TO_USE_DARTHJEE-TENT.md)

## Extending Tent

Tent supports custom PHP classes (matchers, middlewares, handlers) via a mount-based extension mechanism — no fork or image rebuild required.

### How it works

Tent automatically includes `/var/www/html/extension/loader.php` after all core classes are loaded and before `configuration/configure.php` runs. By default this file is a no-op (an empty PHP file). To add custom classes, mount a `loader.php` file at that path:

```yaml
services:
  proxy:
    image: darthjee/tent:latest
    volumes:
      - ./proxy/configuration/:/var/www/html/configuration/
      - ./proxy/extension/:/var/www/html/extension/
```

### Extension loader

Create `./proxy/extension/loader.php` with `require_once` calls for your custom classes:

```php
<?php

require_once __DIR__ . '/MyCustomMatcher.php';
require_once __DIR__ . '/MyCustomMiddleware.php';
```

Because the extension loader runs after all Tent core classes, your custom classes can extend any built-in class or implement any built-in interface.

### Using custom classes in configuration

Once loaded, your classes are available in `configure.php` by their fully-qualified name:

```php
<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => ['type' => 'proxy', 'host' => 'http://backend:80'],
    'matchers' => [
        ['class' => 'MyCustomMatcher', 'pattern' => '/api/v2/']
    ],
    'middlewares' => [
        ['class' => 'MyCustomMiddleware']
    ]
]);
```

---

[← Back to How to Use darthjee/tent](../HOW_TO_USE_DARTHJEE-TENT.md) · Previous: [Complete Example Layout](complete-example.md) · Next: [Reference](reference.md)
