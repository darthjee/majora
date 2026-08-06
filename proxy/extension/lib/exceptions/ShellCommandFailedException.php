<?php

namespace Tent\RequestHandlers;

use RuntimeException;

/**
 * Raised when a shell command executed via ShellExecutorInterface fails,
 * either by exiting with a non-zero status or by producing no output at all
 * (e.g. DuDirectorySizeStrategy expecting a parseable `du -sb` line).
 *
 * Carries the offending command and exit code, so the catch site (or the
 * exception message itself) has everything needed to diagnose the failure
 * without re-deriving it.
 */
class ShellCommandFailedException extends RuntimeException
{
    /** @var string The shell command that failed. */
    private string $command;

    /** @var int The exit code returned by the command. */
    private int $exitCode;

    /**
     * @param string $command  The shell command that failed.
     * @param int    $exitCode The exit code returned by the command.
     */
    public function __construct(string $command, int $exitCode)
    {
        parent::__construct("Shell command failed (exit code $exitCode): $command");
        $this->command = $command;
        $this->exitCode = $exitCode;
    }

    /**
     * @return string The shell command that failed.
     */
    public function command(): string
    {
        return $this->command;
    }

    /**
     * @return int The exit code returned by the command.
     */
    public function exitCode(): int
    {
        return $this->exitCode;
    }
}
