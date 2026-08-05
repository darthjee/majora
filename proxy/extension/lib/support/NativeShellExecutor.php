<?php

namespace Tent\RequestHandlers;

/**
 * Real, PHP exec()-backed implementation of ShellExecutorInterface.
 *
 * Kept as thin as possible: it only wraps exec()'s by-reference output
 * parameters into the array{output, exitCode} shape the interface expects,
 * with no business logic of its own.
 */
class NativeShellExecutor implements ShellExecutorInterface
{
    /**
     * Runs $command via PHP's exec() and returns its output lines and exit
     * code.
     *
     * @param string $command The shell command to run.
     * @return array{output: string[], exitCode: int}
     */
    public function exec(string $command): array
    {
        exec($command, $output, $exitCode);

        return ['output' => $output, 'exitCode' => $exitCode];
    }
}
