<?php

namespace Tent\RequestHandlers;

/**
 * Interface for shell-command execution, used by strategies (e.g.
 * DuDirectorySizeStrategy) that need to shell out to a system binary.
 *
 * This interface allows the real, PHP exec()-backed implementation
 * (NativeShellExecutor) to be swapped for a fake/mock in tests, mirroring
 * the HttpClientInterface seam already used by BackendClient — deterministic
 * unit tests never actually spawn a subprocess.
 */
interface ShellExecutorInterface
{
    /**
     * Runs $command and returns its output lines and exit code.
     *
     * @param string $command The shell command to run.
     * @return array{output: string[], exitCode: int}
     */
    public function exec(string $command): array;
}
