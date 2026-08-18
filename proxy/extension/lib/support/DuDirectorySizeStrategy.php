<?php

namespace Tent\RequestHandlers;

/**
 * Computes a directory's total size by shelling out to `du -sb <path>` and
 * parsing the byte-count prefix off its output.
 *
 * `du -sb` (bytes, summarized) is used instead of `-h`/`-c`: the API
 * contract this feeds (CacheSizeHandler's `{"size": <bytes>}` response) is
 * an exact integer byte count, and `-h`/`-c` output would need lossy
 * re-parsing to recover one. This is meant for Linux environments, where the
 * OS can compute the total far more efficiently than a PHP-level directory
 * walk (see PhpWalkDirectorySizeStrategy for the portable fallback).
 */
class DuDirectorySizeStrategy implements DirectorySizeStrategyInterface
{
    /** @var ShellExecutorInterface Executor used to run the `du` command. */
    private ShellExecutorInterface $shell;

    /**
     * @param ShellExecutorInterface|null $shell Shell executor (defaults to
     *                                             NativeShellExecutor).
     */
    public function __construct(?ShellExecutorInterface $shell=null)
    {
        $this->shell = ($shell ?? new NativeShellExecutor());
    }

    /**
     * Runs `du -sb $path` and parses the byte-count prefix off its output.
     *
     * @param string $path The directory path to measure.
     * @return int Total size in bytes.
     * @throws ShellCommandFailedException When the command exits with a
     *                                       non-zero status, or produces no
     *                                       output to parse.
     */
    public function sizeOf(string $path): int
    {
        $command = 'du -sb ' . escapeshellarg($path);

        $result = $this->shell->exec($command);

        if ($result['exitCode'] !== 0 || empty($result['output'])) {
            throw new ShellCommandFailedException($command, $result['exitCode']);
        }

        [$bytes] = explode("\t", $result['output'][0], 2);

        return (int) $bytes;
    }
}
