# Proxy Plan: Include proxy tests in CircleCI

Main plan: [plan.md](plan.md)

## Shared contracts

- **Coverage file format**: Clover XML (`--coverage-clover`)
- **Coverage file path** (inside CI container): `/tmp/coverage.xml`
- **PHPUnit source root**: `/var/www/html/extension` (excludes `tests/` and `vendor/`)

## Implementation Steps

### Step 1 — Add coverage source configuration to phpunit.xml

PHPUnit 11 requires an explicit `<source>` element in `phpunit.xml` to know which PHP files to include in coverage reports. Without it, coverage output is empty even when `--coverage-*` flags are passed.

Add a `<source>` element that:
- Includes all `.php` files in the current directory (`.`)
- Excludes `tests/` and `vendor/` sub-directories

The resulting phpunit.xml should look like:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
    bootstrap="tests/bootstrap.php"
    colors="true">
    <testsuites>
        <testsuite name="proxy-extension">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory suffix=".php">.</directory>
        </include>
        <exclude>
            <directory>tests</directory>
            <directory>vendor</directory>
        </exclude>
    </source>
</phpunit>
```

## Files to Change

- `proxy/extension/phpunit.xml` — add `<source>` element so PHPUnit 11 knows which files to include in coverage

## Notes

- PHPUnit 11 silently produces empty coverage without `<source>` — this is the only change needed in the proxy layer.
- The `darthjee/tent:0.8.0` image must have Xdebug or PCOV installed for coverage to work. If coverage collection fails in CI, the infra agent may need to add `XDEBUG_MODE=coverage` to the job environment.
- No test code changes are required; this is purely a configuration change.
